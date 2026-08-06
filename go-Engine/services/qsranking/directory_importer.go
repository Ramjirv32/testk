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

func ImportDefaultDirectory(ctx context.Context) (int, error) {
	root, err := findProjectRoot()
	if err != nil {
		return 0, err
	}
	return ImportDirectoryFile(ctx, filepath.Join(root, "browseros_academic", "results", "portals", "qs", "all_universities.json"))
}

func ImportDirectoryFile(ctx context.Context, path string) (int, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return 0, fmt.Errorf("read university directory JSON: %w", err)
	}
	var payload rankingFile
	if err := json.Unmarshal(data, &payload); err != nil {
		return 0, fmt.Errorf("parse university directory JSON: %w", err)
	}
	now := time.Now().UTC()
	ranked := make(map[string]bool)
	cursor, cursorErr := config.QSRankingsCollection.Find(ctx, bson.M{}, options.Find().SetProjection(bson.M{"key": 1, "name": 1}))
	if cursorErr == nil {
		var rows []bson.M
		if cursor.All(ctx, &rows) == nil {
			for _, row := range rows {
				ranked[strings.ToLower(strings.TrimSpace(fmt.Sprint(row["key"])))] = true
				ranked[strings.ToLower(strings.Join(strings.Fields(fmt.Sprint(row["name"])), " "))] = true
			}
		}
		cursor.Close(ctx)
	}
	writes := make([]mongo.WriteModel, 0, len(payload.Universities))
	for _, university := range payload.Universities {
		name := strings.TrimSpace(university.Name)
		if name == "" {
			continue
		}
		key := strings.ToLower(strings.TrimSpace(university.InnerURL))
		if key == "" {
			key = strings.ToLower(strings.Join(strings.Fields(name), " "))
		}
		nameKey := strings.ToLower(strings.Join(strings.Fields(name), " "))
		isRanked := ranked[key] || ranked[nameKey]
		document := bson.M{"key": key, "name": name, "inner_url": strings.TrimSpace(university.InnerURL), "location": strings.TrimSpace(university.Location), "country": countryFromLocation(university.Location), "logo_url": strings.TrimSpace(university.LogoURL), "logo_path": strings.TrimSpace(university.LogoPath), "links": university.Links, "raw_text": university.RawText, "source_pages": university.SourcePages, "source": "QS University Directory", "is_qs_ranked": isRanked, "non_qs": !isRanked, "updated_at": now}
		writes = append(writes, mongo.NewUpdateOneModel().SetFilter(bson.M{"key": key}).SetUpdate(bson.M{"$set": document, "$setOnInsert": bson.M{"created_at": now}}).SetUpsert(true))
	}
	if len(writes) == 0 {
		return 0, fmt.Errorf("university directory JSON contains no universities")
	}
	_, _ = config.QSUniversityDirectoryCollection.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "key", Value: 1}}, Options: options.Index().SetUnique(true)})
	if _, err := config.QSUniversityDirectoryCollection.BulkWrite(ctx, writes, options.BulkWrite().SetOrdered(false)); err != nil {
		return 0, fmt.Errorf("upsert university directory: %w", err)
	}
	_, _ = config.TruDB.Collection("qs_university_directory_meta").UpdateOne(ctx, bson.M{"_id": "latest"}, bson.M{"$set": bson.M{"imported_count": len(writes), "source_file": path, "updated_at": now}}, options.Update().SetUpsert(true))
	return len(writes), nil
}
