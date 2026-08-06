package collegesvc

import (
	"context"
	"log"
	"regexp"
	"strings"
	"time"

	"gobackend/config"
	"gobackend/models"
	"gobackend/services/ai"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func GetCollegeFromCache(collegeName string) (*models.CollegeStats, error) {
	var cachedResult models.CollegeStats
	regexPattern := getFlexibleNameRegex(collegeName)
	err := config.CollegeCollection.FindOne(context.TODO(), bson.M{
		"$or": bson.A{
			bson.M{"college_name": bson.M{"$regex": regexPattern, "$options": "i"}},
			bson.M{"search_aliases": bson.M{"$regex": regexPattern, "$options": "i"}},
		},
	}).Decode(&cachedResult)

	if err != nil {
		return nil, err
	}

	log.Println(" Found in MongoDB cache")
	return &cachedResult, nil
}

func GetApprovedCollegeByName(collegeName string) (*models.CollegeStats, error) {
	var college models.CollegeStats
	regexPattern := getFlexibleNameRegex(collegeName)
	err := config.CollegeCollection.FindOne(context.TODO(), bson.M{
		"college_name":    bson.M{"$regex": regexPattern, "$options": "i"},
		"approval_status": "approved",
	}).Decode(&college)

	if err != nil {
		return nil, err
	}

	log.Printf(" Found approved college: %s", collegeName)
	return &college, nil
}

func SaveCollegeToCache(stats *models.CollegeStats) error {
	now := time.Now()
	stats.UpdatedAt = now

	regexPattern := getFlexibleNameRegex(stats.CollegeName)
	filter := bson.M{"$or": bson.A{
		bson.M{"college_name": bson.M{"$regex": regexPattern, "$options": "i"}},
		bson.M{"search_aliases": bson.M{"$regex": regexPattern, "$options": "i"}},
	}}

	// Check if college already exists and get its approval status
	var existing models.CollegeStats
	err := config.CollegeCollection.FindOne(context.TODO(), filter).Decode(&existing)
	if err == nil {
		if existing.ApprovalStatus == "approved" {
			stats.ApprovalStatus = "approved"
		} else {
			stats.ApprovalStatus = "pending"
		}
	} else {
		stats.ApprovalStatus = "pending"
	}

	raw, marshalErr := bson.Marshal(stats)
	if marshalErr != nil {
		log.Printf(" [Phase1-DB] Marshal failed for %s: %v", stats.CollegeName, marshalErr)
		return marshalErr
	}
	var setDoc bson.M
	if unmarshalErr := bson.Unmarshal(raw, &setDoc); unmarshalErr != nil {
		log.Printf(" [Phase1-DB] Unmarshal failed for %s: %v", stats.CollegeName, unmarshalErr)
		return unmarshalErr
	}
	delete(setDoc, "created_at") // handled exclusively by $setOnInsert

	update := bson.M{
		"$set":         setDoc,
		"$setOnInsert": bson.M{"created_at": now},
	}
	opts := options.Update().SetUpsert(true)

	_, err = config.CollegeCollection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		log.Printf(" [Phase1-DB] Upsert failed for %s: %v", stats.CollegeName, err)
		return err
	}

	log.Printf(" [Phase1-DB] Upserted to MongoDB — %s (status: %s)", stats.CollegeName, stats.ApprovalStatus)
	return nil
}

func UpdateCollegeCache(collegeName string, stats *models.CollegeStats) error {
	stats.UpdatedAt = time.Now()

	regexPattern := getFlexibleNameRegex(collegeName)
	_, err := config.CollegeCollection.UpdateOne(
		context.TODO(),
		bson.M{"college_name": bson.M{"$regex": regexPattern, "$options": "i"}},
		bson.M{"$set": stats},
	)

	if err != nil {
		log.Printf(" Cache update failed: %v", err)
		return err
	}

	log.Printf(" Cache updated for %s", collegeName)
	return nil
}

func ApproveCollege(collegeName, approvedBy string) error {
	regexPattern := getFlexibleNameRegex(collegeName)
	_, err := config.CollegeCollection.UpdateOne(
		context.TODO(),
		bson.M{"college_name": bson.M{"$regex": regexPattern, "$options": "i"}},
		bson.M{
			"$set": bson.M{
				"approval_status": "approved",
				"approved_at":     time.Now(),
				"approved_by":     approvedBy,
				"updated_at":      time.Now(),
			},
		},
	)

	if err != nil {
		log.Printf("Failed to approve college: %v", err)
		return err
	}

	log.Printf(" College approved: %s by %s", collegeName, approvedBy)
	return nil
}

func RejectCollege(collegeName string) error {
	regexPattern := getFlexibleNameRegex(collegeName)
	_, err := config.CollegeCollection.UpdateOne(
		context.TODO(),
		bson.M{"college_name": bson.M{"$regex": regexPattern, "$options": "i"}},
		bson.M{
			"$set": bson.M{
				"approval_status": "rejected",
				"updated_at":      time.Now(),
			},
		},
	)

	if err != nil {
		log.Printf(" Failed to reject college: %v", err)
		return err
	}

	log.Printf(" College rejected: %s", collegeName)
	return nil
}

func GetPendingColleges() ([]models.CollegeStats, error) {
	cursor, err := config.CollegeCollection.Find(context.TODO(), bson.M{
		"approval_status": "pending",
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var colleges []models.CollegeStats
	if err := cursor.All(context.TODO(), &colleges); err != nil {
		return nil, err
	}

	return colleges, nil
}

func GetApprovedColleges() ([]models.CollegeStats, error) {
	cursor, err := config.CollegeCollection.Find(context.TODO(), bson.M{
		"approval_status": bson.M{"$in": []interface{}{"approved", "pending"}},
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var colleges []models.CollegeStats
	if err := cursor.All(context.TODO(), &colleges); err != nil {
		return nil, err
	}

	return colleges, nil
}

func CompareAndUpdateCache(collegeName string, cachedData models.CollegeStats) {
	log.Printf(" Background: Fetching fresh data for %s from Serper", collegeName)

	freshData, err := ai.FetchCollegeDataFromSerper(collegeName, cachedData.Country, cachedData.Location)
	if err != nil {
		log.Printf(" Background Serper fetch error: %v", err)
		return
	}

	// Convert map to CollegeStats
	freshStats := ai.MapMapToCollegeStats(freshData)
	if freshStats == nil {
		log.Printf(" Failed to map Serper data to CollegeStats")
		return
	}

	hasChanged := false
	if cachedData.CollegeName != freshStats.CollegeName {
		hasChanged = true
	} else if cachedData.StudentStatsDetail.TotalEnrollment != freshStats.StudentStatsDetail.TotalEnrollment {
		hasChanged = true
	}

	if hasChanged {
		log.Printf(" Changes detected for %s, updating cache...", collegeName)
		UpdateCollegeCache(collegeName, freshStats)
	} else {
		log.Printf(" No changes detected for %s", collegeName)
	}
}

func SearchUniversityByName(name string) (*models.CollegeStats, error) {
	var result models.CollegeStats
	cleanName := regexp.QuoteMeta(strings.TrimSpace(name))
	err := config.CollegeCollection.FindOne(context.TODO(), bson.M{
		"college_name":    bson.M{"$regex": cleanName, "$options": "i"},
		"approval_status": bson.M{"$in": []interface{}{"approved", "pending"}},
	}).Decode(&result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func GetAllColleges() ([]models.CollegeStats, error) {
	return GetApprovedColleges()
}

func GetDistinctCountries() ([]interface{}, error) {
	countries, err := config.CollegeCollection.Distinct(context.TODO(), "country", bson.M{
		"approval_status": bson.M{"$in": []interface{}{"approved", "pending"}},
	})
	if err != nil {
		return nil, err
	}

	return countries, nil
}

func GetCollegesByCountry(country string) ([]models.CollegeStats, error) {
	cleanCountry := regexp.QuoteMeta(strings.TrimSpace(country))
	cursor, err := config.CollegeCollection.Find(context.TODO(), bson.M{
		"country":         bson.M{"$regex": "^" + cleanCountry + "$", "$options": "i"},
		"approval_status": bson.M{"$in": []interface{}{"approved", "pending"}},
	})
	if err != nil {
		log.Printf(" Error fetching colleges for %s: %v", country, err)
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var colleges []models.CollegeStats
	for cursor.Next(context.TODO()) {
		var college models.CollegeStats
		if err := cursor.Decode(&college); err == nil {
			colleges = append(colleges, college)
		}
	}

	log.Printf(" Found %d approved colleges in %s", len(colleges), country)
	return colleges, nil
}

func UpdateCollege(college *models.CollegeStats) error {
	college.UpdatedAt = time.Now()

	regexPattern := getFlexibleNameRegex(college.CollegeName)
	_, err := config.CollegeCollection.UpdateOne(
		context.TODO(),
		bson.M{"college_name": bson.M{"$regex": regexPattern, "$options": "i"}},
		bson.M{"$set": college},
	)

	if err != nil {
		log.Printf(" Failed to update college: %v", err)
		return err
	}

	log.Printf(" College updated: %s", college.CollegeName)
	return nil
}

func DeleteCollege(collegeName string) error {
	regexPattern := getFlexibleNameRegex(collegeName)
	_, err := config.CollegeCollection.DeleteOne(context.TODO(), bson.M{
		"college_name": bson.M{"$regex": regexPattern, "$options": "i"},
	})

	if err != nil {
		log.Printf(" Failed to delete college: %v", err)
		return err
	}

	log.Printf(" College deleted: %s", collegeName)
	return nil
}
