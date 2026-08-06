package config

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

var (
	Client                          *mongo.Client
	TruDB                           *mongo.Database
	CollegeCollection               *mongo.Collection
	UserCollection                  *mongo.Collection
	SearchAnalyticsCollection       *mongo.Collection
	MinorStudentsCollection         *mongo.Collection
	MajorStudentsCollection         *mongo.Collection
	MVTITestResultsCollection       *mongo.Collection
	CognitiveTestResultsCollection  *mongo.Collection
	TestSessionsCollection          *mongo.Collection
	StudentProfilesCollection       *mongo.Collection
	QSScraperSettingsCollection     *mongo.Collection
	QSRankingsCollection            *mongo.Collection
	QSUniversityProfilesCollection  *mongo.Collection
	QSUniversityDirectoryCollection *mongo.Collection
	PipelineRunsCollection          *mongo.Collection
	PipelineTasksCollection         *mongo.Collection
)

func ConnectDatabase() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		return fmt.Errorf("MONGO_URI environment variable not set")
	}

	var err error
	Client, err = mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		return err
	}

	TruDB = Client.Database("tru-main")
	CollegeCollection = TruDB.Collection("college_details")

	// Create case-insensitive index on college_name to speed up queries
	indexModel := mongo.IndexModel{
		Keys: bson.D{{Key: "college_name", Value: 1}},
		Options: options.Index().SetCollation(&options.Collation{
			Locale:   "en",
			Strength: 2,
		}),
	}
	if _, err := CollegeCollection.Indexes().CreateOne(ctx, indexModel); err != nil {
		log.Printf(" Warning: Failed to create case-insensitive index on college_name: %v", err)
	} else {
		log.Println(" Case-insensitive index on college_name created/verified")
	}

	UserCollection = TruDB.Collection("users")
	SearchAnalyticsCollection = TruDB.Collection("search_analytics")
	MinorStudentsCollection = TruDB.Collection("minor_students")
	MajorStudentsCollection = TruDB.Collection("major_students")
	MVTITestResultsCollection = TruDB.Collection("mvti_test_results")
	CognitiveTestResultsCollection = TruDB.Collection("cognitive_test_results")
	TestSessionsCollection = TruDB.Collection("test_sessions")
	StudentProfilesCollection = TruDB.Collection("student_profiles")
	QSScraperSettingsCollection = TruDB.Collection("qs_scraper_settings")
	QSRankingsCollection = TruDB.Collection("qs_rankings")
	QSUniversityProfilesCollection = TruDB.Collection("qs_university_profiles")
	QSUniversityDirectoryCollection = TruDB.Collection("qs_university_directory")
	PipelineRunsCollection = TruDB.Collection("pipeline_runs")
	PipelineTasksCollection = TruDB.Collection("pipeline_tasks")

	pipelineIndexes := []struct {
		collection *mongo.Collection
		model      mongo.IndexModel
	}{
		{PipelineRunsCollection, mongo.IndexModel{Keys: bson.D{{Key: "college_slug", Value: 1}, {Key: "year", Value: 1}, {Key: "pipeline_version", Value: 1}, {Key: "generation", Value: 1}}, Options: options.Index().SetUnique(true).SetName("pipeline_run_identity")}},
		{PipelineRunsCollection, mongo.IndexModel{Keys: bson.D{{Key: "status", Value: 1}, {Key: "updated_at", Value: 1}}, Options: options.Index().SetName("pipeline_run_status")}},
		{PipelineTasksCollection, mongo.IndexModel{Keys: bson.D{{Key: "pipeline_id", Value: 1}, {Key: "task_type", Value: 1}, {Key: "mode_or_portal", Value: 1}}, Options: options.Index().SetUnique(true).SetName("pipeline_task_identity")}},
		{PipelineTasksCollection, mongo.IndexModel{Keys: bson.D{{Key: "publish_status", Value: 1}, {Key: "next_attempt_at", Value: 1}, {Key: "publish_lease_expires_at", Value: 1}}, Options: options.Index().SetName("pipeline_task_dispatch")}},
		{PipelineTasksCollection, mongo.IndexModel{Keys: bson.D{{Key: "dlq_status", Value: 1}, {Key: "dlq_lease_expires_at", Value: 1}}, Options: options.Index().SetName("pipeline_task_dlq_dispatch")}},
	}
	for _, index := range pipelineIndexes {
		if _, err := index.collection.Indexes().CreateOne(ctx, index.model); err != nil {
			return fmt.Errorf("create pipeline index: %w", err)
		}
	}
	log.Printf(" Connected to MongoDB - Database: %s, Collections: college_details, users, search_analytics, minor_students, major_students, mvti_test_results, cognitive_test_results, test_sessions, student_profiles, qs_scraper_settings, qs_rankings", TruDB.Name())

	return nil
}

func DisconnectDatabase() {
	if Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		Client.Disconnect(ctx)
	}
}
