package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// This script updates University of Waikato rankings in MongoDB
// Updates: QS World Ranking 292 → =281, National Rank 4 → 6
// Based on verified 2026 QS official data

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("ERROR: MONGO_URI environment variable not set")
	}

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	db := client.Database("tru")
	collegeCollection := db.Collection("college_details")

	// Update query for University of Waikato
	filter := bson.M{"college_name": "University of Waikato"}

	update := bson.M{
		"$set": bson.M{
			"rankings.qs_world":      "=281",
			"rankings.national_rank": 6,
			"updated_at":             time.Now(),
		},
	}

	result, err := collegeCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Fatal("Update failed:", err)
	}

	fmt.Printf(" Update Successful!\n")
	fmt.Printf("Matched: %d documents\n", result.MatchedCount)
	fmt.Printf("Modified: %d documents\n", result.ModifiedCount)

	// Verify the update
	var college bson.M
	err = collegeCollection.FindOne(ctx, filter).Decode(&college)
	if err != nil {
		log.Fatal("Verification failed:", err)
	}

	rankings := college["rankings"].(bson.M)
	fmt.Printf("\n Updated Rankings:\n")
	fmt.Printf("QS World: %v (was 292)\n", rankings["qs_world"])
	fmt.Printf("National Rank: %v (was 4)\n", rankings["national_rank"])
}
