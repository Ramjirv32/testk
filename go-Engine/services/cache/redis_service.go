package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"gobackend/config"
	"gobackend/models"

	"go.mongodb.org/mongo-driver/bson"
)

const (
	RedisCollegePrefix = "college:"
	RedisCacheTTL      = 24 * time.Hour
)

type RedisService struct{}

func NewRedisService() *RedisService {
	return &RedisService{}
}

func (r *RedisService) GetCollegeFromRedis(collegeName string) (*models.CollegeStats, error) {
	if config.RedisClient == nil {
		return nil, fmt.Errorf("redis client not initialized")
	}

	key := RedisCollegePrefix + strings.ToLower(strings.TrimSpace(collegeName))
	val, err := config.RedisClient.Get(config.RedisCtx, key).Result()
	if err != nil {
		return nil, err
	}

	var college models.CollegeStats
	if err := json.Unmarshal([]byte(val), &college); err != nil {
		return nil, fmt.Errorf("failed to unmarshal college data: %w", err)
	}

	log.Printf(" Redis HIT for: %s", collegeName)
	return &college, nil
}

func (r *RedisService) SaveCollegeToRedis(college *models.CollegeStats) error {
	return r.SaveCollegeToRedisWithKey(college.CollegeName, college)
}

func (r *RedisService) SaveCollegeToRedisWithKey(keyName string, college *models.CollegeStats) error {
	if config.RedisClient == nil {
		log.Println(" Redis client not initialized, skipping cache")
		return nil
	}

	key := RedisCollegePrefix + strings.ToLower(strings.TrimSpace(keyName))
	data, err := json.Marshal(college)
	if err != nil {
		return fmt.Errorf("failed to marshal college data: %w", err)
	}

	err = config.RedisClient.Set(config.RedisCtx, key, data, RedisCacheTTL).Err()
	if err != nil {
		return fmt.Errorf("failed to save to redis: %w", err)
	}

	log.Printf(" Saved to Redis: %s (Status: %s, TTL: %v)", key, college.ApprovalStatus, RedisCacheTTL)
	return nil
}

func (r *RedisService) UpdateCollegeInRedis(college *models.CollegeStats) error {
	return r.SaveCollegeToRedis(college)
}

func (r *RedisService) DeleteCollegeFromRedis(collegeName string) error {
	if config.RedisClient == nil {
		return nil
	}

	if collegeName == "" {
		return fmt.Errorf("college name cannot be empty")
	}

	key := RedisCollegePrefix + strings.ToLower(strings.TrimSpace(collegeName))
	err := config.RedisClient.Del(config.RedisCtx, key).Err()
	if err != nil {
		return fmt.Errorf("failed to delete from redis: %w", err)
	}

	log.Printf(" Deleted from Redis: %s", key)
	return nil
}

func (r *RedisService) PopulateRedisFromDB() (int, error) {
	if config.RedisClient == nil {
		return 0, fmt.Errorf("redis client not initialized")
	}

	// Get both approved and pending colleges directly from DB
	cursor, err := config.CollegeCollection.Find(context.TODO(), bson.M{})
	if err != nil {
		return 0, fmt.Errorf("failed to fetch colleges from DB: %w", err)
	}
	defer cursor.Close(context.TODO())

	var allColleges []models.CollegeStats
	if err := cursor.All(context.TODO(), &allColleges); err != nil {
		return 0, fmt.Errorf("failed to decode colleges: %w", err)
	}

	count := 0
	for _, college := range allColleges {
		if err := r.SaveCollegeToRedis(&college); err != nil {
			log.Printf(" Failed to save %s to Redis: %v", college.CollegeName, err)
			continue
		}
		count++
	}

	log.Printf(" Populated Redis with %d colleges", count)
	return count, nil
}

func (r *RedisService) ClearAllCollegesFromRedis() error {
	if config.RedisClient == nil {
		return fmt.Errorf("redis client not initialized")
	}

	keys, err := config.RedisClient.Keys(config.RedisCtx, RedisCollegePrefix+"*").Result()
	if err != nil {
		return fmt.Errorf("failed to get keys: %w", err)
	}

	if len(keys) == 0 {
		log.Println("ℹ️ No college keys found in Redis")
		return nil
	}

	deleted, err := config.RedisClient.Del(config.RedisCtx, keys...).Result()
	if err != nil {
		return fmt.Errorf("failed to delete keys: %w", err)
	}

	log.Printf(" Cleared %d college entries from Redis", deleted)
	return nil
}

func (r *RedisService) GetRedisStats() (map[string]interface{}, error) {
	if config.RedisClient == nil {
		return nil, fmt.Errorf("redis client not initialized")
	}

	keys, err := config.RedisClient.Keys(config.RedisCtx, RedisCollegePrefix+"*").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get keys: %w", err)
	}

	info, err := config.RedisClient.Info(config.RedisCtx, "memory").Result()
	if err != nil {
		log.Printf(" Failed to get Redis info: %v", err)
		info = "unavailable"
	}

	stats := map[string]interface{}{
		"total_colleges": len(keys),
		"cache_ttl":      RedisCacheTTL.String(),
		"redis_info":     info,
		"timestamp":      time.Now(),
	}

	return stats, nil
}

func (r *RedisService) CompareAndSyncWithDB(collegeName string) error {
	redisCollege, redisErr := r.GetCollegeFromRedis(collegeName)

	var dbCollege models.CollegeStats
	err := config.CollegeCollection.FindOne(context.TODO(), bson.M{
		"college_name":    bson.M{"$regex": "^" + collegeName + "$", "$options": "i"},
		"approval_status": "approved",
	}).Decode(&dbCollege)

	if err != nil {
		if redisErr == nil {
			log.Printf(" College %s not approved in DB, removing from Redis", collegeName)
			return r.DeleteCollegeFromRedis(collegeName)
		}
		return nil
	}

	if redisErr != nil {
		log.Printf(" College %s approved in DB but not in Redis, adding", collegeName)
		return r.SaveCollegeToRedis(&dbCollege)
	}

	if !dbCollege.UpdatedAt.Equal(redisCollege.UpdatedAt) {
		log.Printf(" College %s data differs, updating Redis from DB", collegeName)
		return r.UpdateCollegeInRedis(&dbCollege)
	}

	log.Printf(" College %s is in sync between Redis and DB", collegeName)
	return nil
}

func (r *RedisService) GetAllCachedColleges() ([]string, error) {
	if config.RedisClient == nil {
		return nil, fmt.Errorf("redis client not initialized")
	}

	keys, err := config.RedisClient.Keys(config.RedisCtx, RedisCollegePrefix+"*").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get keys: %w", err)
	}

	colleges := make([]string, 0, len(keys))
	for _, key := range keys {
		collegeName := key[len(RedisCollegePrefix):]
		colleges = append(colleges, collegeName)
	}

	return colleges, nil
}
