package qsranking

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gobackend/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ImportDefaultProfiles(ctx context.Context) (int, error) {
	projectRoot, err := findProjectRoot()
	if err != nil {
		return 0, err
	}
	directory := filepath.Join(projectRoot, "browseros_academic", "results", "portals", "qs", "profiles")
	entries, err := os.ReadDir(directory)
	if os.IsNotExist(err) {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("read QS profiles directory: %w", err)
	}

	now := time.Now().UTC()
	profileWrites := make([]mongo.WriteModel, 0, len(entries))
	rankingWrites := make([]mongo.WriteModel, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(directory, entry.Name()))
		if err != nil {
			continue
		}
		var profile bson.M
		if json.Unmarshal(data, &profile) != nil {
			continue
		}
		name := strings.TrimSpace(fmt.Sprint(profile["college_name"]))
		if name == "" || name == "<nil>" {
			continue
		}
		key := strings.ToLower(strings.Join(strings.Fields(name), " "))
		profile["key"] = key
		profile["updated_at"] = now
		profileWrites = append(profileWrites, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"key": key}).
			SetUpdate(bson.M{"$set": profile, "$setOnInsert": bson.M{"created_at": now}}).
			SetUpsert(true))

		set := bson.M{"profile_available": true, "profile_updated_at": now}
		if filters, ok := profile["filters"].(map[string]interface{}); ok {
			for _, field := range []string{"disciplines", "university_type", "formats", "degrees", "special_programs"} {
				if value, exists := filters[field]; exists {
					set[field] = value
				}
			}
		} else if filters, ok := profile["filters"].(bson.M); ok {
			for field, value := range filters {
				set[field] = value
			}
		}
		rankingWrites = append(rankingWrites, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"$or": bson.A{bson.M{"key": key}, bson.M{"name": name}}}).
			SetUpdate(bson.M{"$set": set}))
	}
	if len(profileWrites) == 0 {
		return 0, nil
	}
	if _, err := config.QSUniversityProfilesCollection.BulkWrite(ctx, profileWrites, options.BulkWrite().SetOrdered(false)); err != nil {
		return 0, fmt.Errorf("upsert QS profiles: %w", err)
	}
	if len(rankingWrites) > 0 {
		_, _ = config.QSRankingsCollection.BulkWrite(ctx, rankingWrites, options.BulkWrite().SetOrdered(false))
	}
	InvalidateRankingListCache(ctx)
	return len(profileWrites), nil
}

func UpsertProfile(ctx context.Context, profile bson.M) error {
	name := strings.TrimSpace(fmt.Sprint(profile["college_name"]))
	if name == "" || name == "<nil>" {
		return fmt.Errorf("college_name is required")
	}
	now := time.Now().UTC()
	key := strings.ToLower(strings.Join(strings.Fields(name), " "))
	profile["key"] = key
	profile["updated_at"] = now
	_, err := config.QSUniversityProfilesCollection.UpdateOne(
		ctx,
		bson.M{"key": key},
		bson.M{"$set": profile, "$setOnInsert": bson.M{"created_at": now}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return fmt.Errorf("upsert QS profile: %w", err)
	}
	set := bson.M{"profile_available": true, "profile_updated_at": now}
	if filters, ok := profile["filters"].(map[string]interface{}); ok {
		for field, value := range filters {
			set[field] = value
		}
	} else if filters, ok := profile["filters"].(bson.M); ok {
		for field, value := range filters {
			set[field] = value
		}
	}
	_, err = config.QSRankingsCollection.UpdateOne(ctx, bson.M{"$or": bson.A{bson.M{"key": key}, bson.M{"name": name}}}, bson.M{"$set": set})
	if err != nil {
		return fmt.Errorf("link QS profile to ranking: %w", err)
	}
	InvalidateRankingListCache(ctx)
	_, _ = config.QSUniversityDirectoryCollection.UpdateOne(ctx, bson.M{"$or": bson.A{bson.M{"key": key}, bson.M{"name": name}}}, bson.M{"$set": set})
	return nil
}
