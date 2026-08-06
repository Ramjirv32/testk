package qsranking

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"gobackend/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type rankingFile struct {
	Universities []rankingUniversity `json:"universities"`
}

type rankingUniversity struct {
	Rank        string              `json:"rank"`
	Score       string              `json:"score"`
	Name        string              `json:"name"`
	InnerURL    string              `json:"inner_url"`
	Location    string              `json:"location"`
	LogoURL     string              `json:"logo_url"`
	LogoPath    string              `json:"logo_path"`
	Links       []map[string]string `json:"links"`
	RawText     string              `json:"raw_text"`
	SourcePages []int               `json:"source_pages"`
}

var firstNumber = regexp.MustCompile(`\d+`)

func ImportDefaultRankings(ctx context.Context) (int, error) {
	projectRoot, err := findProjectRoot()
	if err != nil {
		return 0, err
	}
	path := filepath.Join(projectRoot, "browseros_academic", "results", "portals", "qs", "qs_rankings.json")
	return ImportRankingsFile(ctx, path)
}

func ImportRankingsFile(ctx context.Context, path string) (int, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0, fmt.Errorf("read QS rankings JSON: %w", err)
	}
	var payload rankingFile
	if err := json.Unmarshal(data, &payload); err != nil {
		return 0, fmt.Errorf("parse QS rankings JSON: %w", err)
	}

	now := time.Now().UTC()
	edition := currentQSEdition(now)
	models := make([]mongo.WriteModel, 0, len(payload.Universities))
	for _, university := range payload.Universities {
		university.Rank = strings.TrimSpace(university.Rank)
		university.Name = strings.TrimSpace(university.Name)
		if university.Rank == "" || university.Name == "" {
			continue
		}
		key := strings.ToLower(strings.TrimSpace(university.InnerURL))
		if key == "" {
			key = strings.ToLower(strings.Join(strings.Fields(university.Name), " "))
		}
		document := bson.M{
			"ranking_year": edition,
			"key":          key,
			"rank":         university.Rank,
			"rank_order":   rankOrder(university.Rank),
			"score":        strings.TrimSpace(university.Score),
			"score_number": scoreNumber(university.Score),
			"name":         university.Name,
			"inner_url":    strings.TrimSpace(university.InnerURL),
			"location":     strings.TrimSpace(university.Location),
			"country":      countryFromLocation(university.Location),
			"logo_url":     strings.TrimSpace(university.LogoURL),
			"logo_path":    strings.TrimSpace(university.LogoPath),
			"links":        university.Links,
			"raw_text":     university.RawText,
			"source_pages": university.SourcePages,
			"source":       "QS",
			"updated_at":   now,
		}
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"ranking_year": edition, "key": key}).
			SetUpdate(bson.M{"$set": document, "$setOnInsert": bson.M{"created_at": now}}).
			SetUpsert(true))
	}
	if len(models) == 0 {
		return 0, fmt.Errorf("QS rankings JSON contains no ranked universities")
	}

	index := mongo.IndexModel{
		Keys:    bson.D{{Key: "ranking_year", Value: 1}, {Key: "key", Value: 1}},
		Options: options.Index().SetUnique(true),
	}
	if _, err := config.QSRankingsCollection.Indexes().CreateOne(ctx, index); err != nil {
		return 0, fmt.Errorf("create QS rankings index: %w", err)
	}
	if _, err := config.QSRankingsCollection.BulkWrite(ctx, models, options.BulkWrite().SetOrdered(false)); err != nil {
		return 0, fmt.Errorf("upsert QS rankings into MongoDB: %w", err)
	}

	_, _ = config.TruDB.Collection("qs_rankings_meta").UpdateOne(
		ctx,
		bson.M{"_id": "latest"},
		bson.M{"$set": bson.M{
			"ranking_year":   edition,
			"imported_count": len(models),
			"source_file":    path,
			"updated_at":     now,
		}},
		options.Update().SetUpsert(true),
	)
	InvalidateRankingListCache(ctx)
	return len(models), nil
}

func scoreNumber(score string) float64 {
	value, _ := strconv.ParseFloat(strings.TrimSpace(score), 64)
	return value
}

func currentQSEdition(now time.Time) int {
	if now.Month() >= time.June {
		return now.Year() + 1
	}
	return now.Year()
}

func rankOrder(rank string) int {
	match := firstNumber.FindString(rank)
	if match == "" {
		return 999999
	}
	value, err := strconv.Atoi(match)
	if err != nil {
		return 999999
	}
	return value
}

func countryFromLocation(location string) string {
	parts := strings.Split(location, ",")
	return strings.TrimSpace(parts[len(parts)-1])
}
