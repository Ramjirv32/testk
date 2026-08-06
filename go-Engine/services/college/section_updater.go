package collegesvc

import (
	"context"
	"log"
	"regexp"
	"strings"
	"sync"
	"time"

	"gobackend/config"
	"gobackend/models"
	"gobackend/services/ai"
	"gobackend/services/cache"
	"gobackend/services/realtime"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	CollegeUpdateMutexes = make(map[string]*sync.Mutex)
	GlobalMutex          sync.Mutex
)

func getMutexForCollege(name string) *sync.Mutex {
	GlobalMutex.Lock()
	defer GlobalMutex.Unlock()
	if mu, ok := CollegeUpdateMutexes[name]; ok {
		return mu
	}
	mu := &sync.Mutex{}
	CollegeUpdateMutexes[name] = mu
	return mu
}

func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func getFlexibleNameRegex(name string) string {
	// Strip commas, parentheses, brackets, single quotes, double quotes from query
	reg := regexp.MustCompile(`[,\(\)\[\]\'\"&]`)
	cleaned := reg.ReplaceAllString(name, "")

	// Treat spaces, hyphens, underscores, and dots as separators
	r := regexp.MustCompile(`[ \-_\.]+`)
	normalized := r.ReplaceAllString(strings.TrimSpace(cleaned), " ")

	var builder strings.Builder
	builder.WriteString("^")

	words := strings.Split(normalized, " ")
	for i, word := range words {
		if i > 0 {
			builder.WriteString(`[- ,().]*`)
		}
		if len(word) <= 7 {
			// It's likely an abbreviation (e.g. RV, KPR, KPRIET, IIT, MIT)
			// Allow any combination of dots, spaces, hyphens between characters
			for j, char := range word {
				if j > 0 {
					builder.WriteString(`[- ,().]*`)
				}
				builder.WriteString(regexp.QuoteMeta(string(char)))
			}
		} else {
			// For regular words, just match the word characters (allowing optional dots/hyphens inside)
			for j, char := range word {
				if j > 0 {
					builder.WriteString(`[-.]?`)
				}
				builder.WriteString(regexp.QuoteMeta(string(char)))
			}
		}
	}
	builder.WriteString(`[- ,().]*$`)
	return builder.String()
}

func UpdateSectionInCache(officialName string, searchQuery string, section string, sectionData map[string]interface{}) {
	// Per-college mutex prevents two sections from writing simultaneously
	mu := getMutexForCollege(officialName)
	mu.Lock()
	defer mu.Unlock()

	log.Printf(" [Serper %s] Persisting to MongoDB + Redis for: %s", section, officialName)

	// Map Serper raw JSON → typed CollegeStats fields
	tempStats := ai.MapMapToCollegeStats(sectionData)

	// Build a targeted MongoDB $set — only touch this section's fields
	setFields := bson.M{
		"updated_at":                 time.Now(),
		"serper_sections." + section: sectionData,
	}
	switch section {
	case "programs":
		if len(tempStats.UGPrograms) > 0 {
			setFields["ug_programs"] = tempStats.UGPrograms
		}
		if len(tempStats.PGPrograms) > 0 {
			setFields["pg_programs"] = tempStats.PGPrograms
		}
		if len(tempStats.PhDPrograms) > 0 {
			setFields["phd_programs"] = tempStats.PhDPrograms
		}
		if len(tempStats.Departments) > 0 {
			setFields["departments"] = tempStats.Departments
		}

	case "placements":
		setFields["placements"] = tempStats.Placements
		if len(tempStats.PlacementComparison) > 0 {
			setFields["placement_comparison_last_3_years"] = tempStats.PlacementComparison
		}
		if len(tempStats.TopRecruiters) > 0 {
			setFields["top_recruiters"] = tempStats.TopRecruiters
		}
		if tempStats.PlacementHighlights != "" {
			setFields["placement_highlights"] = tempStats.PlacementHighlights
		}

	case "fees":
		setFields["fees"] = tempStats.Fees
		if len(tempStats.FeesByYear) > 0 {
			setFields["fees_by_year"] = tempStats.FeesByYear
		}
		if tempStats.FeesNote != "" {
			setFields["fees_note"] = tempStats.FeesNote
		}

	case "infrastructure":
		if len(tempStats.Infrastructure) > 0 {
			setFields["infrastructure"] = tempStats.Infrastructure
		}
		setFields["hostel_details"] = tempStats.HostelDetails
		setFields["library_details"] = tempStats.LibraryDetails
		setFields["transport_details"] = tempStats.TransportDetails

	case "scholarships":
		if len(tempStats.ScholarshipsDetail) > 0 {
			setFields["scholarships_detail"] = tempStats.ScholarshipsDetail
		}

	case "ranking":
		setFields["rankings"] = tempStats.Rankings
		if len(tempStats.RankingsHistory) > 0 {
			setFields["rankings_history"] = tempStats.RankingsHistory
		}
		setFields["global_ranking"] = tempStats.GlobalRankingObj

	case "basic_info":
		setFields["short_name"] = tempStats.ShortName
		setFields["established"] = tempStats.Established
		setFields["institution_type"] = tempStats.InstitutionType
		setFields["country"] = tempStats.Country
		setFields["location"] = tempStats.Location
		setFields["website"] = tempStats.Website
		setFields["about"] = tempStats.About
		setFields["summary"] = tempStats.Summary
		setFields["student_statistics_detail"] = tempStats.StudentStatsDetail
		setFields["faculty_staff_detail"] = tempStats.FacultyStaffDetail
		setFields["rankings"] = tempStats.Rankings
		setFields["student_history"] = tempStats.StudentHistory
		setFields["contact_info"] = tempStats.ContactInfo
		setFields["accreditations"] = tempStats.Accreditations
		setFields["affiliations"] = tempStats.Affiliations
		setFields["recognition"] = tempStats.Recognition
		setFields["campus_area"] = tempStats.CampusArea
	}

	//  MongoDB: targeted $set with Upsert
	regexPattern := getFlexibleNameRegex(officialName)
	filter := bson.M{"college_name": bson.M{"$regex": regexPattern, "$options": "i"}}

	update := bson.M{
		"$set": setFields,
		"$setOnInsert": bson.M{
			"college_name":    officialName,
			"approval_status": "pending",
			"created_at":      time.Now(),
		},
	}

	opts := options.Update().SetUpsert(true)
	res, err := config.CollegeCollection.UpdateOne(
		context.TODO(),
		filter,
		update,
		opts,
	)
	if err != nil {
		log.Printf(" [Serper %s] MongoDB update failed for %s: %v", section, officialName, err)
	} else {
		log.Printf(" [Serper %s] MongoDB updated (Upsert) — %s (matched:%d modified:%d upsertedID:%v)",
			section, officialName, res.MatchedCount, res.ModifiedCount, res.UpsertedID)
	}

	//  Redis Sync
	// Re-fetch document from DB to ensure we have the full structure
	var updatedStats models.CollegeStats
	err = config.CollegeCollection.FindOne(context.TODO(), filter).Decode(&updatedStats)
	if err == nil {
		ai.SyncLegacyFields(&updatedStats)

		// Write legacy fields back to MongoDB
		legacySet := bson.M{
			"student_statistics":     updatedStats.StudentStatistics,
			"additional_details":     updatedStats.AdditionalDetailsItems,
			"student_gender_ratio":   updatedStats.LegacyGenderRatio,
			"international_students": updatedStats.LegacyInternationalCount,
			"faculty_staff":          updatedStats.LegacyFacultyCount,
		}
		if _, legErr := config.CollegeCollection.UpdateOne(
			context.TODO(), filter, bson.M{"$set": legacySet},
		); legErr != nil {
			log.Printf(" [Serper %s] Legacy fields writeback failed: %v", section, legErr)
		}

		rs := cache.NewRedisService()
		rs.SaveCollegeToRedis(&updatedStats)
		if searchQuery != "" && searchQuery != officialName {
			rs.SaveCollegeToRedisWithKey(searchQuery, &updatedStats)
			ai.SaveToCache(searchQuery, &updatedStats)
		}
		// Also local cache sync
		ai.SaveToCache(officialName, &updatedStats)
		log.Printf(" [Serper %s] Redis + Local Cache updated for — %s", section, officialName)
	} else {
		log.Printf(" [Serper %s] Re-fetch after DB write failed: %v", section, err)
	}

	//  WebSocket broadcast
	realtime.BroadcastCollegeScrapingUpdate(officialName, "section_complete", map[string]interface{}{
		"section": section,
		"data":    sectionData,
	})
	if searchQuery != "" && searchQuery != officialName {
		realtime.BroadcastCollegeScrapingUpdate(searchQuery, "section_complete", map[string]interface{}{
			"section": section,
			"data":    sectionData,
		})
	}
	log.Printf(" [Serper %s] WebSocket broadcast sent for: %s", section, officialName)
}

func UpdateSectionAndFileInCache(officialName string, searchQuery string, section string, filename string, sectionData map[string]interface{}) {
	updateSectionAndFileInCache(officialName, searchQuery, section, filename, "", sectionData)
}

func UpdateSectionAndFileInCacheForPipeline(officialName string, searchQuery string, section string, filename string, pipelineID string, sectionData map[string]interface{}) {
	updateSectionAndFileInCache(officialName, searchQuery, section, filename, pipelineID, sectionData)
}

func updateSectionAndFileInCache(officialName string, searchQuery string, section string, filename string, pipelineID string, sectionData map[string]interface{}) {
	// Per-college mutex prevents two sections from writing simultaneously
	mu := getMutexForCollege(officialName)
	mu.Lock()
	defer mu.Unlock()

	log.Printf(" [Serper %s] Persisting Section %s (%s) to MongoDB + Redis for: %s", section, section, filename, officialName)

	// Map Serper raw JSON → typed CollegeStats fields
	tempStats := ai.MapMapToCollegeStats(sectionData)

	// Build a targeted MongoDB $set — only touch this section's fields and files
	setFields := bson.M{
		"updated_at": time.Now(),
	}

	if section != "" {
		setFields["serper_sections."+section] = sectionData

		switch section {
		case "programs":
			if len(tempStats.UGPrograms) > 0 {
				setFields["ug_programs"] = tempStats.UGPrograms
			}
			if len(tempStats.PGPrograms) > 0 {
				setFields["pg_programs"] = tempStats.PGPrograms
			}
			if len(tempStats.PhDPrograms) > 0 {
				setFields["phd_programs"] = tempStats.PhDPrograms
			}
			if len(tempStats.Departments) > 0 {
				setFields["departments"] = tempStats.Departments
			}

		case "placements":
			setFields["placements"] = tempStats.Placements
			if len(tempStats.PlacementComparison) > 0 {
				setFields["placement_comparison_last_3_years"] = tempStats.PlacementComparison
			}
			if len(tempStats.GenderPlacement) > 0 {
				setFields["gender_based_placement_last_3_years"] = tempStats.GenderPlacement
			}
			if len(tempStats.SectorPlacement) > 0 {
				setFields["sector_wise_placement_last_3_years"] = tempStats.SectorPlacement
			}
			if len(tempStats.TopRecruiters) > 0 {
				setFields["top_recruiters"] = tempStats.TopRecruiters
			}
			if tempStats.PlacementHighlights != "" {
				setFields["placement_highlights"] = tempStats.PlacementHighlights
			}

		case "fees":
			setFields["fees"] = tempStats.Fees
			if len(tempStats.FeesByYear) > 0 {
				setFields["fees_by_year"] = tempStats.FeesByYear
			}
			if tempStats.FeesNote != "" {
				setFields["fees_note"] = tempStats.FeesNote
			}

		case "infrastructure":
			if len(tempStats.Infrastructure) > 0 {
				setFields["infrastructure"] = tempStats.Infrastructure
			}
			setFields["hostel_details"] = tempStats.HostelDetails
			setFields["library_details"] = tempStats.LibraryDetails
			setFields["transport_details"] = tempStats.TransportDetails

		case "scholarships":
			if len(tempStats.ScholarshipsDetail) > 0 {
				setFields["scholarships_detail"] = tempStats.ScholarshipsDetail
			}

		case "ranking":
			setFields["rankings"] = tempStats.Rankings
			if len(tempStats.RankingsHistory) > 0 {
				setFields["rankings_history"] = tempStats.RankingsHistory
			}
			setFields["global_ranking"] = tempStats.GlobalRankingObj

		case "basic_info":
			if tempStats.ShortName != "" {
				setFields["short_name"] = tempStats.ShortName
			}
			if tempStats.Established > 0 {
				setFields["established"] = tempStats.Established
			}
			if tempStats.InstitutionType != "" {
				setFields["institution_type"] = tempStats.InstitutionType
			}
			if tempStats.Country != "" {
				setFields["country"] = tempStats.Country
			}
			if tempStats.Location != "" {
				setFields["location"] = tempStats.Location
			}
			if tempStats.Website != "" {
				setFields["website"] = tempStats.Website
			}
			if tempStats.About != "" {
				setFields["about"] = tempStats.About
			}
			if tempStats.Summary != "" {
				setFields["summary"] = tempStats.Summary
			}
			if tempStats.StudentStatsDetail.TotalEnrollment > 0 || tempStats.StudentStatsDetail.UGStudents > 0 || tempStats.StudentStatsDetail.PGStudents > 0 || tempStats.StudentStatsDetail.PhDStudents > 0 {
				setFields["student_statistics_detail"] = tempStats.StudentStatsDetail
			}
			if tempStats.FacultyStaffDetail.TotalFaculty > 0 || tempStats.FacultyStaffDetail.StudentFacultyRatio > 0 {
				setFields["faculty_staff_detail"] = tempStats.FacultyStaffDetail
			}
			if tempStats.Rankings.QSWorld != nil || tempStats.Rankings.THEWorld != nil || tempStats.Rankings.NIRFRank != nil || tempStats.Rankings.NIRF2025 != nil || tempStats.Rankings.NIRF2024 != nil {
				setFields["rankings"] = tempStats.Rankings
			}
			if len(tempStats.StudentHistory.CountComparison) > 0 || tempStats.StudentHistory.GenderRatio.MalePercent > 0 || tempStats.StudentHistory.International.TotalCount > 0 {
				setFields["student_history"] = tempStats.StudentHistory
			}
			if tempStats.ContactInfo.Email != "" || tempStats.ContactInfo.Phone != "" || tempStats.ContactInfo.Address != "" {
				setFields["contact_info"] = tempStats.ContactInfo
			}
			if len(tempStats.Accreditations) > 0 {
				setFields["accreditations"] = tempStats.Accreditations
			}
			if len(tempStats.Affiliations) > 0 {
				setFields["affiliations"] = tempStats.Affiliations
			}
			if tempStats.Recognition != "" {
				setFields["recognition"] = tempStats.Recognition
			}
			if tempStats.CampusArea != "" {
				setFields["campus_area"] = tempStats.CampusArea
			}
		}
	}

	if filename != "" {
		setFields["files."+filename] = sectionData
	}

	//  MongoDB: targeted $set with Upsert
	regexPattern := getFlexibleNameRegex(officialName)
	filter := bson.M{"college_name": bson.M{"$regex": regexPattern, "$options": "i"}}

	update := bson.M{
		"$set": setFields,
		"$setOnInsert": bson.M{
			"college_name":    officialName,
			"approval_status": "pending",
			"created_at":      time.Now(),
		},
	}

	opts := options.Update().SetUpsert(true)
	res, err := config.CollegeCollection.UpdateOne(
		context.TODO(),
		filter,
		update,
		opts,
	)
	if err != nil {
		log.Printf(" [Serper %s] MongoDB update failed for %s: %v", section, officialName, err)
	} else {
		log.Printf(" [Serper %s] MongoDB updated (Upsert) — %s (matched:%d modified:%d upsertedID:%v)",
			section, officialName, res.MatchedCount, res.ModifiedCount, res.UpsertedID)
	}

	//  Redis Sync
	var updatedStats models.CollegeStats
	err = config.CollegeCollection.FindOne(context.TODO(), filter).Decode(&updatedStats)
	if err == nil {
		ai.SyncLegacyFields(&updatedStats)

		// Write legacy fields back to MongoDB
		legacySet := bson.M{
			"student_statistics":     updatedStats.StudentStatistics,
			"additional_details":     updatedStats.AdditionalDetailsItems,
			"student_gender_ratio":   updatedStats.LegacyGenderRatio,
			"international_students": updatedStats.LegacyInternationalCount,
			"faculty_staff":          updatedStats.LegacyFacultyCount,
		}
		if _, legErr := config.CollegeCollection.UpdateOne(
			context.TODO(), filter, bson.M{"$set": legacySet},
		); legErr != nil {
			log.Printf(" [Serper %s] Legacy fields writeback failed: %v", section, legErr)
		}

		rs := cache.NewRedisService()
		rs.SaveCollegeToRedis(&updatedStats)
		if searchQuery != "" && searchQuery != officialName {
			rs.SaveCollegeToRedisWithKey(searchQuery, &updatedStats)
			ai.SaveToCache(searchQuery, &updatedStats)
		}
		ai.SaveToCache(officialName, &updatedStats)
		log.Printf(" [Serper %s] Redis + Local Cache updated for — %s", section, officialName)
	} else {
		log.Printf(" [Serper %s] Re-fetch after DB write failed: %v", section, err)
	}

	//  WebSocket broadcast
	broadcastData := map[string]interface{}{
		"section":     section,
		"filename":    filename,
		"pipeline_id": pipelineID,
		"data":        sectionData,
	}
	realtime.BroadcastCollegeScrapingUpdate(officialName, "section_complete", broadcastData)
	if searchQuery != "" && searchQuery != officialName {
		realtime.BroadcastCollegeScrapingUpdate(searchQuery, "section_complete", broadcastData)
	}
	log.Printf(" [Serper %s] WebSocket broadcast sent for: %s", section, officialName)
}
