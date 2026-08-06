package collegesvc

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"gobackend/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// SerperStorageService handles saving Serper data to:
// 1. Filesystem: /serper_cache/[YEAR]/[COLLEGE_NAME]/[section].json
// 2. MongoDB: db.serper_collection with { year, college_name, section, data }
// 3. Redis: key = "serper:[YEAR]:[COLLEGE_NAME]:[SECTION]"

type SerperEntry struct {
	Year        int                    `bson:"year" json:"year"`
	CollegeName string                 `bson:"college_name" json:"college_name"`
	Section     string                 `bson:"section" json:"section"`
	Data        map[string]interface{} `bson:"data" json:"data"`
	Timestamp   time.Time              `bson:"timestamp" json:"timestamp"`
	Source      string                 `bson:"source" json:"source"` // "serpapi", "scraper", etc
}

const SerperCacheDir = "serper_cache"

// SaveSerperDataByYear saves Serper response to filesystem, MongoDB, and Redis
func SaveSerperDataByYear(collegeName string, year int, section string, data map[string]interface{}) error {
	if collegeName == "" || year == 0 || section == "" {
		return fmt.Errorf("collegeName, year, and section are required")
	}

	// 1. Save to Filesystem
	err := saveSerperToFilesystem(collegeName, year, section, data)
	if err != nil {
		log.Printf("[SERPER] Filesystem save failed: %v", err)
	}

	// 2. Save to MongoDB
	err = saveSerperToMongoDB(collegeName, year, section, data)
	if err != nil {
		log.Printf("[SERPER] MongoDB save failed: %v", err)
	}

	// 3. Save to Redis
	err = saveSerperToRedis(collegeName, year, section, data)
	if err != nil {
		log.Printf("[SERPER] Redis save failed: %v", err)
	}

	return nil
}

// saveSerperToFilesystem saves to: serper_cache/[YEAR]/[COLLEGE_NAME]/[section].json
func saveSerperToFilesystem(collegeName string, year int, section string, data map[string]interface{}) error {
	// Create directory structure: serper_cache/2026/PSG INSTITUTE OF ENGINEERING AND TECHNOLOGY/
	dir := filepath.Join(SerperCacheDir, fmt.Sprintf("%d", year), collegeName)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %v", dir, err)
	}

	// Write JSON file: serper_cache/2026/PSG INSTITUTE OF ENGINEERING AND TECHNOLOGY/basic_info.json
	filePath := filepath.Join(dir, fmt.Sprintf("%s.json", section))
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %v", err)
	}

	if err := os.WriteFile(filePath, jsonData, 0644); err != nil {
		return fmt.Errorf("failed to write file %s: %v", filePath, err)
	}

	log.Printf("[SERPER] Saved to filesystem: %s", filePath)
	return nil
}

// saveSerperToMongoDB saves to: db.serper_collection
func saveSerperToMongoDB(collegeName string, year int, section string, data map[string]interface{}) error {
	client := config.Client
	if client == nil {
		return fmt.Errorf("MongoDB client not initialized")
	}

	collection := client.Database("tru-main").Collection("serper_collection")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	entry := SerperEntry{
		Year:        year,
		CollegeName: collegeName,
		Section:     section,
		Data:        data,
		Timestamp:   time.Now(),
		Source:      "serpapi",
	}

	// Upsert: if exists (year + collegeName + section), update; else insert
	filter := bson.M{
		"year":         year,
		"college_name": collegeName,
		"section":      section,
	}

	opts := options.Replace().SetUpsert(true)

	_, err := collection.ReplaceOne(ctx, filter, entry, opts)
	if err != nil {
		return fmt.Errorf("failed to upsert MongoDB: %v", err)
	}

	log.Printf("[SERPER] Saved to MongoDB: year=%d, college=%s, section=%s", year, collegeName, section)
	return nil
}

// saveSerperToRedis saves to: "serper:[YEAR]:[COLLEGE_NAME]:[SECTION]"
func saveSerperToRedis(collegeName string, year int, section string, data map[string]interface{}) error {
	redisClient := config.RedisClient
	if redisClient == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	key := fmt.Sprintf("serper:%d:%s:%s", year, collegeName, section)
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Set with 30-day expiration
	err = redisClient.Set(ctx, key, jsonData, 30*24*time.Hour).Err()
	if err != nil {
		return fmt.Errorf("failed to set Redis: %v", err)
	}

	log.Printf("[SERPER] Saved to Redis: %s (TTL: 30 days)", key)
	return nil
}

// GetSerperDataByYear retrieves from filesystem/MongoDB/Redis
func GetSerperDataByYear(collegeName string, year int, section string) (map[string]interface{}, error) {
	// Try Redis first (fastest)
	data, err := getSerperFromRedis(collegeName, year, section)
	if err == nil && data != nil {
		log.Printf("[SERPER] Retrieved from Redis: year=%d, college=%s, section=%s", year, collegeName, section)
		return data, nil
	}

	// Try MongoDB
	data, err = getSerperFromMongoDB(collegeName, year, section)
	if err == nil && data != nil {
		log.Printf("[SERPER] Retrieved from MongoDB: year=%d, college=%s, section=%s", year, collegeName, section)
		// Refresh Redis
		_ = saveSerperToRedis(collegeName, year, section, data)
		return data, nil
	}

	// Try Filesystem
	data, err = getSerperFromFilesystem(collegeName, year, section)
	if err == nil && data != nil {
		log.Printf("[SERPER] Retrieved from Filesystem: year=%d, college=%s, section=%s", year, collegeName, section)
		// Populate Redis and MongoDB
		_ = saveSerperToRedis(collegeName, year, section, data)
		_ = saveSerperToMongoDB(collegeName, year, section, data)
		return data, nil
	}

	return nil, fmt.Errorf("serper data not found: year=%d, college=%s, section=%s", year, collegeName, section)
}

// getSerperFromFilesystem retrieves from: serper_cache/[YEAR]/[COLLEGE_NAME]/[section].json
func getSerperFromFilesystem(collegeName string, year int, section string) (map[string]interface{}, error) {
	filePath := filepath.Join(SerperCacheDir, fmt.Sprintf("%d", year), collegeName, fmt.Sprintf("%s.json", section))

	jsonData, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("file not found: %s", filePath)
	}

	var data map[string]interface{}
	if err := json.Unmarshal(jsonData, &data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	return data, nil
}

// getSerperFromMongoDB retrieves from: db.serper_collection
func getSerperFromMongoDB(collegeName string, year int, section string) (map[string]interface{}, error) {
	client := config.Client
	if client == nil {
		return nil, fmt.Errorf("MongoDB client not initialized")
	}

	collection := client.Database("tru-main").Collection("serper_collection")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{
		"year":         year,
		"college_name": collegeName,
		"section":      section,
	}

	var entry SerperEntry
	err := collection.FindOne(ctx, filter).Decode(&entry)
	if err != nil {
		return nil, fmt.Errorf("not found in MongoDB: %v", err)
	}

	return entry.Data, nil
}

// getSerperFromRedis retrieves from: "serper:[YEAR]:[COLLEGE_NAME]:[SECTION]"
func getSerperFromRedis(collegeName string, year int, section string) (map[string]interface{}, error) {
	redisClient := config.RedisClient
	if redisClient == nil {
		return nil, fmt.Errorf("Redis client not initialized")
	}

	key := fmt.Sprintf("serper:%d:%s:%s", year, collegeName, section)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	val, err := redisClient.Get(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("not found in Redis: %v", err)
	}

	var data map[string]interface{}
	if err := json.Unmarshal([]byte(val), &data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %v", err)
	}

	return data, nil
}

// GetAllSectionsForCollege retrieves all sections for a college in a given year
func GetAllSectionsForCollege(collegeName string, year int) (map[string]map[string]interface{}, error) {
	sections := []string{
		"basic_info",
		"programs_and_departments",
		"placements_and_fees",
		"departments_enriched",
		"admissions_enriched",
		"campus_facilities",
		"scholarships",
	}

	result := make(map[string]map[string]interface{})
	for _, section := range sections {
		data, err := GetSerperDataByYear(collegeName, year, section)
		if err == nil && data != nil {
			result[section] = data
		}
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("no sections found for college=%s, year=%d", collegeName, year)
	}

	return result, nil
}

// ListCollegesByYear lists all colleges in serper_cache/[YEAR]/ directory
func ListCollegesByYear(year int) ([]string, error) {
	yearDir := filepath.Join(SerperCacheDir, fmt.Sprintf("%d", year))
	entries, err := os.ReadDir(yearDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %v", err)
	}

	var colleges []string
	for _, entry := range entries {
		if entry.IsDir() {
			colleges = append(colleges, entry.Name())
		}
	}

	return colleges, nil
}

// ListYearsForCollege lists all years available for a college
func ListYearsForCollege(collegeName string) ([]int, error) {
	entries, err := os.ReadDir(SerperCacheDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read cache directory: %v", err)
	}

	var years []int
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		collegeDir := filepath.Join(SerperCacheDir, entry.Name(), collegeName)
		if _, err := os.Stat(collegeDir); err == nil {
			var year int
			fmt.Sscanf(entry.Name(), "%d", &year)
			if year > 0 {
				years = append(years, year)
			}
		}
	}

	return years, nil
}
