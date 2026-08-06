package ai

import (
	"strings"
	"sync"
	"time"

	"gobackend/models"
)

type CacheEntry struct {
	Data      *models.CollegeStats
	ExpiresAt time.Time
}

type CollegeCache struct {
	mu    sync.RWMutex
	cache map[string]CacheEntry
	ttl   time.Duration
}

func NewCollegeCache(ttl time.Duration) *CollegeCache {
	cache := &CollegeCache{
		cache: make(map[string]CacheEntry),
		ttl:   ttl,
	}
	go cache.cleanup()
	return cache
}

func (c *CollegeCache) Get(key string) (*models.CollegeStats, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, exists := c.cache[key]
	if !exists || time.Now().After(entry.ExpiresAt) {
		return nil, false
	}
	return entry.Data, true
}

func (c *CollegeCache) Set(key string, data *models.CollegeStats) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache[key] = CacheEntry{
		Data:      data,
		ExpiresAt: time.Now().Add(c.ttl),
	}
}

func (c *CollegeCache) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for key, entry := range c.cache {
			if now.After(entry.ExpiresAt) {
				delete(c.cache, key)
			}
		}
		c.mu.Unlock()
	}
}

var collegeCache *CollegeCache

func InitializeCache() {
	collegeCache = NewCollegeCache(1 * time.Hour)
}

func GetFromCache(collegeName string) (*models.CollegeStats, bool) {
	if collegeCache == nil {
		return nil, false
	}
	cacheKey := strings.ToLower(strings.TrimSpace(collegeName))
	return collegeCache.Get(cacheKey)
}

func SaveToCache(collegeName string, data *models.CollegeStats) {
	if collegeCache == nil {
		return
	}
	cacheKey := strings.ToLower(strings.TrimSpace(collegeName))
	collegeCache.Set(cacheKey, data)
}
