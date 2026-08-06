package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/go-redis/redis/v8"
)

var (
	RedisClient *redis.Client
	RedisCtx    = context.Background()
)

func ConnectRedis() error {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}

	redisPort := os.Getenv("REDIS_PORT")
	if redisPort == "" {
		redisPort = "6379"
	}

	redisPassword := os.Getenv("REDIS_PASSWORD")

	redisDB := 0
	if dbStr := os.Getenv("REDIS_DB"); dbStr != "" {
		if db, err := strconv.Atoi(dbStr); err == nil {
			redisDB = db
		}
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password: redisPassword,
		DB:       redisDB,
	})

	_, err := RedisClient.Ping(RedisCtx).Result()
	if err != nil {
		log.Printf(" Redis connection failed: %v", err)
		log.Println(" Continuing without Redis cache...")
		return err
	}

	log.Printf(" Connected to Redis at %s:%s", redisHost, redisPort)
	return nil
}

func DisconnectRedis() {
	if RedisClient != nil {
		RedisClient.Close()
		log.Println(" Redis connection closed")
	}
}
