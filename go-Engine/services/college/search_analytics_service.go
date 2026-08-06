package collegesvc

import (
	"context"
	"log"
	"regexp"
	"strings"
	"time"

	"gobackend/config"
	"gobackend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func TrackCollegeSearch(collegeName, country string) error {
	ctx := context.TODO()

	cleanName := regexp.QuoteMeta(strings.TrimSpace(collegeName))
	filter := bson.M{"college_name": bson.M{"$regex": "^" + cleanName + "$", "$options": "i"}}

	update := bson.M{
		"$inc": bson.M{"search_count": 1},
		"$set": bson.M{
			"last_searched": time.Now(),
			"college_name":  collegeName,
			"country":       country,
		},
	}

	opts := options.Update().SetUpsert(true)

	_, err := config.SearchAnalyticsCollection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		log.Printf(" Failed to track search for %s: %v", collegeName, err)
		return err
	}

	log.Printf(" Tracked search: %s (Country: %s)", collegeName, country)
	return nil
}

func GetMostSearchedColleges(limit int) ([]models.SearchAnalytics, error) {
	ctx := context.TODO()

	opts := options.Find().
		SetSort(bson.D{{Key: "search_count", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := config.SearchAnalyticsCollection.Find(ctx, bson.M{}, opts)
	if err != nil {
		log.Printf(" Failed to fetch most searched colleges: %v", err)
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []models.SearchAnalytics
	if err := cursor.All(ctx, &results); err != nil {
		log.Printf(" Failed to decode search analytics: %v", err)
		return nil, err
	}

	log.Printf(" Retrieved %d most searched colleges", len(results))
	return results, nil
}
