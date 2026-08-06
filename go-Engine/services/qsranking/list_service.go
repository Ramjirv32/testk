package qsranking

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"

	"gobackend/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type RankingListItem struct {
	RankingYear int    `bson:"ranking_year" json:"ranking_year"`
	Rank        string `bson:"rank" json:"rank"`
	RankOrder   int    `bson:"rank_order" json:"rank_order"`
	Score       string `bson:"score" json:"score"`
	Name        string `bson:"name" json:"name"`
	InnerURL    string `bson:"inner_url" json:"inner_url"`
	Location    string `bson:"location" json:"location"`
	Country     string `bson:"country" json:"country"`
	LogoURL     string `bson:"logo_url" json:"logo_url"`
	LogoPath    string `bson:"logo_path" json:"logo_path"`
	IsQSRanked  bool   `bson:"is_qs_ranked" json:"is_qs_ranked"`
}

func ListDirectory(ctx context.Context, page, perPage int, filters RankingFilters) (*RankingListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 25
	}
	if perPage > 100 {
		perPage = 100
	}
	filter := bson.M{}
	if search := strings.TrimSpace(filters.Search); search != "" {
		safe := regexp.QuoteMeta(search)
		filter["$or"] = bson.A{bson.M{"name": bson.M{"$regex": safe, "$options": "i"}}, bson.M{"location": bson.M{"$regex": safe, "$options": "i"}}}
	}
	if country := strings.TrimSpace(filters.Country); country != "" {
		filter["country"] = country
	}
	total, err := config.QSUniversityDirectoryCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("count university directory: %w", err)
	}
	options := options.Find().SetSort(bson.D{{Key: "name", Value: 1}}).SetSkip(int64((page - 1) * perPage)).SetLimit(int64(perPage)).SetProjection(bson.M{"_id": 0})
	cursor, err := config.QSUniversityDirectoryCollection.Find(ctx, filter, options)
	if err != nil {
		return nil, fmt.Errorf("find university directory: %w", err)
	}
	defer cursor.Close(ctx)
	items := make([]RankingListItem, 0, perPage)
	if err := cursor.All(ctx, &items); err != nil {
		return nil, fmt.Errorf("decode university directory: %w", err)
	}
	values, err := config.QSUniversityDirectoryCollection.Distinct(ctx, "country", bson.M{"country": bson.M{"$ne": ""}})
	if err != nil {
		return nil, fmt.Errorf("list directory countries: %w", err)
	}
	countries := make([]string, 0, len(values))
	for _, value := range values {
		if country, ok := value.(string); ok && strings.TrimSpace(country) != "" {
			countries = append(countries, country)
		}
	}
	sort.Strings(countries)
	return &RankingListResponse{Items: items, Countries: countries, Page: page, PerPage: perPage, TotalItems: total, TotalPages: int(math.Ceil(float64(total) / float64(perPage))), Year: latestRankingYear(ctx), Cache: "mongodb"}, nil
}

type RankingListResponse struct {
	Items      []RankingListItem `json:"items"`
	Countries  []string          `json:"countries"`
	Page       int               `json:"page"`
	PerPage    int               `json:"per_page"`
	TotalItems int64             `json:"total_items"`
	TotalPages int               `json:"total_pages"`
	Year       int               `json:"ranking_year"`
	Cache      string            `json:"cache"`
}

type RankingFilters struct {
	Search         string
	Country        string
	RankMin        int
	RankMax        int
	ScoreMin       float64
	Discipline     string
	TuitionMax     int
	UniversityType string
	Format         string
	Degree         string
	SpecialProgram string
}

func ListRankings(ctx context.Context, page, perPage, year int, filters RankingFilters) (*RankingListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 25
	}
	if perPage > 100 {
		perPage = 100
	}
	if year < 1 {
		year = latestRankingYear(ctx)
	}
	filters.Search = strings.TrimSpace(filters.Search)
	filters.Country = strings.TrimSpace(filters.Country)

	cacheKey := rankingListCacheKey(page, perPage, year, filters)
	if config.RedisClient != nil {
		if cached, err := config.RedisClient.Get(ctx, cacheKey).Bytes(); err == nil {
			var response RankingListResponse
			if json.Unmarshal(cached, &response) == nil {
				response.Cache = "redis"
				return &response, nil
			}
		}
	}

	filter := bson.M{"ranking_year": year}
	if filters.Search != "" {
		safeSearch := regexp.QuoteMeta(filters.Search)
		filter["$or"] = bson.A{
			bson.M{"name": bson.M{"$regex": safeSearch, "$options": "i"}},
			bson.M{"location": bson.M{"$regex": safeSearch, "$options": "i"}},
		}
	}
	if filters.Country != "" {
		filter["country"] = filters.Country
	}
	if filters.RankMin > 0 || filters.RankMax > 0 {
		rankFilter := bson.M{}
		if filters.RankMin > 0 {
			rankFilter["$gte"] = filters.RankMin
		}
		if filters.RankMax > 0 {
			rankFilter["$lte"] = filters.RankMax
		}
		filter["rank_order"] = rankFilter
	}
	if filters.ScoreMin > 0 {
		filter["score_number"] = bson.M{"$gte": filters.ScoreMin}
	}
	if filters.Discipline != "" {
		filter["disciplines"] = filters.Discipline
	}
	if filters.TuitionMax > 0 {
		filter["tuition_fee_min"] = bson.M{"$lte": filters.TuitionMax}
	}
	if filters.UniversityType != "" {
		filter["university_type"] = filters.UniversityType
	}
	if filters.Format != "" {
		filter["formats"] = filters.Format
	}
	if filters.Degree != "" {
		filter["degrees"] = filters.Degree
	}
	if filters.SpecialProgram != "" {
		filter["special_programs"] = filters.SpecialProgram
	}

	total, err := config.QSRankingsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("count QS rankings: %w", err)
	}
	findOptions := options.Find().
		SetSort(bson.D{{Key: "rank_order", Value: 1}, {Key: "name", Value: 1}}).
		SetSkip(int64((page - 1) * perPage)).
		SetLimit(int64(perPage)).
		SetProjection(bson.M{
			"_id": 0, "ranking_year": 1, "rank": 1, "rank_order": 1,
			"score": 1, "name": 1, "inner_url": 1, "location": 1,
			"country": 1, "logo_url": 1, "logo_path": 1,
		})
	cursor, err := config.QSRankingsCollection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, fmt.Errorf("find QS rankings: %w", err)
	}
	defer cursor.Close(ctx)
	items := make([]RankingListItem, 0, perPage)
	if err := cursor.All(ctx, &items); err != nil {
		return nil, fmt.Errorf("decode QS rankings: %w", err)
	}

	countries, err := rankingCountries(ctx, year)
	if err != nil {
		return nil, err
	}
	response := &RankingListResponse{
		Items:      items,
		Countries:  countries,
		Page:       page,
		PerPage:    perPage,
		TotalItems: total,
		TotalPages: int(math.Ceil(float64(total) / float64(perPage))),
		Year:       year,
		Cache:      "mongodb",
	}
	if config.RedisClient != nil {
		if encoded, err := json.Marshal(response); err == nil {
			_ = config.RedisClient.Set(ctx, cacheKey, encoded, 30*time.Minute).Err()
		}
	}
	return response, nil
}

func latestRankingYear(ctx context.Context) int {
	var meta struct {
		RankingYear int `bson:"ranking_year"`
	}
	if err := config.TruDB.Collection("qs_rankings_meta").FindOne(ctx, bson.M{"_id": "latest"}).Decode(&meta); err == nil && meta.RankingYear > 0 {
		return meta.RankingYear
	}
	return currentQSEdition(time.Now())
}

func rankingCountries(ctx context.Context, year int) ([]string, error) {
	values, err := config.QSRankingsCollection.Distinct(ctx, "country", bson.M{"ranking_year": year, "country": bson.M{"$ne": ""}})
	if err != nil {
		return nil, fmt.Errorf("list QS ranking countries: %w", err)
	}
	countries := make([]string, 0, len(values))
	for _, value := range values {
		if country, ok := value.(string); ok && strings.TrimSpace(country) != "" {
			countries = append(countries, country)
		}
	}
	sort.Strings(countries)
	return countries, nil
}

func rankingListCacheKey(page, perPage, year int, filters RankingFilters) string {
	filterText, _ := json.Marshal(filters)
	digest := sha256.Sum256(filterText)
	return fmt.Sprintf("qs:rankings:v1:%d:%d:%d:%s", year, page, perPage, hex.EncodeToString(digest[:8]))
}

func InvalidateRankingListCache(ctx context.Context) {
	if config.RedisClient == nil {
		return
	}
	var cursor uint64
	for {
		keys, next, err := config.RedisClient.Scan(ctx, cursor, "qs:rankings:v1:*", 200).Result()
		if err != nil {
			return
		}
		if len(keys) > 0 {
			_ = config.RedisClient.Del(ctx, keys...).Err()
		}
		cursor = next
		if cursor == 0 {
			return
		}
	}
}
