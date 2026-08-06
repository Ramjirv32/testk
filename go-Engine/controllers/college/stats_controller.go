package college

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"gobackend/config"
	"gobackend/models"
	"gobackend/services/ai"
	"gobackend/services/cache"
	collegesvc "gobackend/services/college"
	"gobackend/services/realtime"
	"gobackend/utils"

	"go.mongodb.org/mongo-driver/bson"
)

func GetCollegeStatistics(w http.ResponseWriter, r *http.Request) {
	collegeName := strings.TrimSpace(r.URL.Query().Get("college_name"))
	country := strings.TrimSpace(r.URL.Query().Get("country"))
	location := strings.TrimSpace(r.URL.Query().Get("city")) // "city" in UI map to "location" in backend

	if collegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "college_name required"})
		return
	}

	// QS directory profiles are already normalized and should be returned
	// before invoking name validation or starting the general crawler.
	qsCtx, qsCancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer qsCancel()
	var qsProfile bson.M
	qsName := bson.M{"$regex": "^" + regexp.QuoteMeta(collegeName) + "$", "$options": "i"}
	if err := config.QSUniversityProfilesCollection.FindOne(qsCtx, bson.M{"college_name": qsName}).Decode(&qsProfile); err == nil {
		delete(qsProfile, "_id")
		delete(qsProfile, "key")
		go collegesvc.TrackCollegeSearch(collegeName, fmt.Sprint(qsProfile["country"]))
		utils.RespondJSON(w, http.StatusOK, qsProfile)
		return
	}
	var qsRanking bson.M
	if err := config.QSRankingsCollection.FindOne(qsCtx, bson.M{"name": qsName}).Decode(&qsRanking); err == nil {
		utils.RespondJSON(w, http.StatusOK, bson.M{
			"college_name": qsRanking["name"], "country": qsRanking["country"],
			"location": qsRanking["location"], "logo_path": qsRanking["logo_path"],
			"source": "QS", "source_url": qsRanking["inner_url"], "website": qsRanking["inner_url"],
			"summary":         "This QS university profile is in the managed scraping queue. Detailed sections will appear automatically when processing completes.",
			"approval_status": "fetching", "profile_pending": true,
			"qs_profile": bson.M{"rank": qsRanking["rank"], "score": qsRanking["score"]},
			"programs":   bson.M{"ug_programs": bson.A{}, "pg_programs": bson.A{}, "phd_programs": bson.A{}, "departments": bson.A{}},
			"filters":    bson.M{"disciplines": bson.A{}, "formats": bson.A{}, "degrees": bson.A{}, "special_programs": bson.A{}},
		})
		return
	}

	// 1. VALIDATE AND NORMALIZE USING GROQ
	validationReq := collegesvc.CollegeValidationRequest{
		CollegeName: collegeName,
		Country:     country,
		City:        location,
	}
	validated := collegesvc.ValidateCollegeName(validationReq)

	if validated.IsValid {
		log.Printf(" Groq Normalized: '%s' -> '%s' (%s, %s)", collegeName, validated.Name, validated.Location, validated.Country)
		// Switch to official names for all subsequent operations
		collegeName = validated.Name
		country = validated.Country
		location = validated.Location
	} else {
		log.Printf(" Groq Validation Failed for: %s. Error: %s", collegeName, validated.Error)
		// If Groq explicitly couldn't find it, we might want to stop here to avoid junk searches
		if strings.Contains(validated.Name, "N/A") || validated.Error != "" {
			utils.RespondJSON(w, http.StatusNotFound, map[string]interface{}{
				"error":        "College not found",
				"details":      validated.Error,
				"college_name": collegeName,
				"is_na":        true,
			})
			return
		}
	}

	log.Printf(" Fetching stats for: %s", collegeName)

	var mongoCollege *models.CollegeStats
	var mongoErr error

	redisCollege, redisErr := redisService.GetCollegeFromRedis(collegeName)
	if redisErr == nil {
		log.Printf(" Redis HIT for: %s (status: %s)", collegeName, redisCollege.ApprovalStatus)
		go collegesvc.TrackCollegeSearch(redisCollege.CollegeName, redisCollege.Country)
		utils.RespondJSON(w, http.StatusOK, redisCollege)
		return
	}

	log.Printf("ℹ️ Cache MISS for: %s, checking MongoDB...", collegeName)

	// TRY EXACT MATCH FIRST (most reliable for IDs/scraped names)
	err := config.CollegeCollection.FindOne(context.TODO(), bson.M{
		"college_name": collegeName,
	}).Decode(&mongoCollege)

	if err != nil {
		// FALLBACK: CASE INSENSITIVE REGEX (for natural language search)
		mongoCollege, mongoErr = collegesvc.GetCollegeFromCache(collegeName)
	} else {
		mongoErr = nil
	}

	if mongoErr == nil && mongoCollege != nil {
		log.Printf(" MongoDB HIT for: %s (status: %s)", collegeName, mongoCollege.ApprovalStatus)

		// Sync to Redis immediately (both approved and pending)
		go redisService.SaveCollegeToRedis(mongoCollege)

		go collegesvc.TrackCollegeSearch(mongoCollege.CollegeName, mongoCollege.Country)
		utils.RespondJSON(w, http.StatusOK, mongoCollege)
		return
	}

	log.Printf("ℹ️ MongoDB MISS for: %s, auto-triggering Go Orchestrator pipeline...", collegeName)

	go func(cName, cCountry, cLoc string) {
		orchestratorURL := os.Getenv("ORCHESTRATOR_URL")
		if orchestratorURL == "" {
			orchestratorURL = "http://localhost:4300"
		}
		runURL := fmt.Sprintf("%s/api/run", strings.TrimSuffix(orchestratorURL, "/"))

		requestBody, _ := json.Marshal(map[string]interface{}{
			"college_name": cName,
			"modes":        "",
			"year":         "2026",
		})

		log.Printf(" Auto-triggering Go Orchestrator for: %s at %s", cName, runURL)
		resp, err := http.Post(runURL, "application/json", bytes.NewBuffer(requestBody))
		if err != nil {
			log.Printf(" Auto-trigger failed for %s: %v", cName, err)
			return
		}
		defer resp.Body.Close()
		log.Printf(" Auto-triggered Go Orchestrator for %s. Response status: %d", cName, resp.StatusCode)
	}(collegeName, country, location)

	utils.RespondJSON(w, http.StatusAccepted, map[string]string{
		"error":  "College not found in database. Scraping has been automatically triggered.",
		"status": "scraping_started",
	})
}

// IngestCollege receives the raw scraped data from python pipeline, maps it, and saves to DB.
// POST /api/ingest/college
func IngestCollege(w http.ResponseWriter, r *http.Request) {
	expectedApiKey := os.Getenv("INTERNAL_API_KEY")
	if expectedApiKey == "" {
		expectedApiKey = "default-internal-key"
	}
	clientApiKey := r.Header.Get("X-Internal-API-Key")
	if clientApiKey != expectedApiKey {
		log.Printf(" Unauthorized ingestion attempt from IP: %s (Key: %s)", r.RemoteAddr, clientApiKey)
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var rawData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&rawData); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
		return
	}

	// 1. Flatten the structured rawData maps to let MapMapToCollegeStats parse it properly
	flatData := make(map[string]interface{})
	for k, v := range rawData {
		flatData[k] = v
	}

	basicInfo, _ := rawData["basic_info"].(map[string]interface{})
	programs, _ := rawData["programs"].(map[string]interface{})
	placements, _ := rawData["placements"].(map[string]interface{})
	fees, _ := rawData["fees"].(map[string]interface{})
	infra, _ := rawData["infrastructure"].(map[string]interface{})
	ranking, _ := rawData["ranking"].(map[string]interface{})

	if basicInfo != nil {
		if nameVal := ai.GetString(basicInfo, "college_name"); nameVal != "" {
			flatData["college_name"] = nameVal
		} else if nameVal := ai.GetString(basicInfo, "name"); nameVal != "" {
			flatData["college_name"] = nameVal
		} else if idVal := ai.GetString(basicInfo, "college_id"); idVal != "" {
			flatData["college_name"] = idVal
		} else if ai.GetString(rawData, "college_name") != "" {
			flatData["college_name"] = ai.GetString(rawData, "college_name")
		} else if idVal := ai.GetString(rawData, "college_id"); idVal != "" {
			flatData["college_name"] = idVal
		}

		flatData["location"] = ai.GetString(basicInfo, "location")
		flatData["country"] = ai.GetString(basicInfo, "country")

		establishedVal := basicInfo["established"]
		if establishedVal == nil {
			establishedVal = basicInfo["established_year"]
		}
		flatData["established"] = establishedVal

		instTypeVal := ai.GetString(basicInfo, "institution_type")
		if instTypeVal == "" {
			instTypeVal = ai.GetString(basicInfo, "type")
		}
		flatData["institution_type"] = instTypeVal

		websiteVal := ai.GetString(basicInfo, "website")
		if websiteVal == "" {
			websiteVal = ai.GetString(basicInfo, "official_website")
		}
		flatData["website"] = websiteVal

		flatData["about"] = ai.GetString(basicInfo, "about")

		summaryVal := ai.GetString(basicInfo, "summary")
		if summaryVal == "" {
			summaryVal = ai.GetString(basicInfo, "about")
		}
		flatData["summary"] = summaryVal

		flatData["student_statistics_detail"] = basicInfo["student_statistics"]
		flatData["student_history"] = basicInfo["student_history"]
		flatData["accreditations"] = basicInfo["accreditations"]

		affiliationsVal := basicInfo["affiliations"]
		if affiliationsVal == nil {
			affiliationsVal = basicInfo["approved_by"]
		}
		flatData["affiliations"] = affiliationsVal

		flatData["recognition"] = ai.GetString(basicInfo, "recognition")
		flatData["campus_area"] = ai.GetString(basicInfo, "campus_area")

		if contact, ok := basicInfo["contact_info"].(map[string]interface{}); ok {
			flatData["contact_info"] = contact
		}

		if rankingsObj, ok := basicInfo["rankings"].(map[string]interface{}); ok {
			flatData["rankings"] = rankingsObj
		}
	}

	files, _ := rawData["files"].(map[string]interface{})

	if programs != nil {
		flatData["ug_programs"] = programs["ug_programs"]
		flatData["pg_programs"] = programs["pg_programs"]
		flatData["phd_programs"] = programs["phd_programs"]
		flatData["departments"] = programs["departments"]
	}

	// Extract placements from placements_statistics.json if available
	var placementsSource map[string]interface{}
	if files != nil {
		if pStats, ok := files["placements_statistics.json"].(map[string]interface{}); ok {
			placementsSource = pStats
		}
	}
	if placementsSource == nil {
		placementsSource = placements
	}

	if placementsSource != nil {
		flatData["placements"] = placementsSource["placements"]
		flatData["placement_comparison_last_3_years"] = placementsSource["placement_comparison_last_3_years"]
		flatData["gender_based_placement_last_3_years"] = placementsSource["gender_based_placement_last_3_years"]
		flatData["sector_wise_placement_last_3_years"] = placementsSource["sector_wise_placement_last_3_years"]
		flatData["top_recruiters"] = placementsSource["top_recruiters"]
		flatData["placement_highlights"] = ai.GetString(placementsSource, "placement_highlights")
	}

	if fees != nil {
		flatData["fees"] = fees["fees"]
		flatData["fees_by_year"] = fees["fees_by_year"]
		flatData["scholarships_detail"] = fees["scholarships_detail"]
	}

	// Override scholarships from scholarships.json if available in files
	if files != nil {
		if sStats, ok := files["scholarships.json"].(map[string]interface{}); ok {
			if sData := sStats["data"]; sData != nil {
				flatData["scholarships_detail"] = sData
			} else if sData := sStats["scholarships"]; sData != nil {
				flatData["scholarships_detail"] = sData
			}
		}
	}

	if infra != nil {
		flatData["infrastructure"] = infra["infrastructure"]
		flatData["hostel_details"] = infra["hostel_details"]
		flatData["transport_details"] = infra["transport_details"]
		flatData["library_details"] = infra["library_details"]
		if flatData["scholarships_detail"] == nil {
			flatData["scholarships_detail"] = infra["scholarships"]
		}
	}

	// Extract rankings from ranking.json if available
	var rankingSource map[string]interface{}
	if files != nil {
		if rStats, ok := files["ranking.json"].(map[string]interface{}); ok {
			rankingSource = rStats
		}
	}
	if rankingSource == nil {
		rankingSource = ranking
	}

	if rankingSource != nil {
		if rComp := rankingSource["rankings_comparison_last_3_years"]; rComp != nil {
			flatData["rankings_history"] = rComp
		} else if rComp := rankingSource["ranking_comparison_last_3_years"]; rComp != nil {
			flatData["rankings_history"] = rComp
		}
		if rankingsObj, ok := rankingSource["rankings"].(map[string]interface{}); ok {
			flatData["rankings"] = rankingsObj
		}
	}

	collegeName := strings.TrimSpace(ai.GetString(flatData, "college_name"))
	country := strings.TrimSpace(ai.GetString(flatData, "country"))
	location := strings.TrimSpace(ai.GetString(flatData, "location")) // Ensure location is set safely

	if collegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "college_name is required"})
		return
	}

	// 2. Map to CollegeStats model
	stats := ai.MapMapToCollegeStats(flatData)
	stats.ApprovalStatus = "pending"
	stats.CreatedAt = time.Now()
	stats.UpdatedAt = time.Now()
	if country != "" {
		stats.Country = country
	}
	if location != "" {
		stats.Location = location
	}
	stats.CollegeName = collegeName
	stats.SerperSections = rawData
	stats.Files = files

	// 3. Save to MongoDB
	if err := collegesvc.SaveCollegeToCache(stats); err != nil {
		log.Printf(" Failed to save ingested college: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to save to MongoDB"})
		return
	}

	// 4. Save to Redis
	rs := cache.NewRedisService()
	rs.SaveCollegeToRedis(stats)
	ai.SaveToCache(stats.CollegeName, stats)

	// 5. Broadcast phase 1 complete
	realtime.BroadcastCollegeScrapingUpdate(stats.CollegeName, "phase1_complete", stats)

	log.Printf(" College ingested and saved successfully: %s", stats.CollegeName)
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"message":      "College ingested successfully",
		"college_name": stats.CollegeName,
	})
}

// IngestSection receives a single section's raw scraped data from the python pipeline and persists it.
// POST /api/ingest/section
func IngestSection(w http.ResponseWriter, r *http.Request) {
	expectedApiKey := os.Getenv("INTERNAL_API_KEY")
	if expectedApiKey == "" {
		expectedApiKey = "default-internal-key"
	}
	clientApiKey := r.Header.Get("X-Internal-API-Key")
	if clientApiKey != expectedApiKey {
		log.Printf(" Unauthorized section ingestion attempt from IP: %s", r.RemoteAddr)
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	type SectionIngestRequest struct {
		CollegeName string                 `json:"college_name"`
		SearchQuery string                 `json:"search_query"`
		Section     string                 `json:"section"`
		Filename    string                 `json:"filename"`
		Data        map[string]interface{} `json:"data"`
	}

	var req SectionIngestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
		return
	}

	if req.CollegeName == "" || req.Section == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "college_name and section are required"})
		return
	}

	// Persist the section and update the file cache, then trigger WebSocket broadcast
	collegesvc.UpdateSectionAndFileInCache(req.CollegeName, req.SearchQuery, req.Section, req.Filename, req.Data)

	log.Printf(" Section %s ingested successfully for: %s", req.Section, req.CollegeName)
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Section ingested successfully",
	})
}

// IngestComplete receives a notification that the scraping pipeline is complete
// POST /api/ingest/complete
func IngestComplete(w http.ResponseWriter, r *http.Request) {
	expectedApiKey := os.Getenv("INTERNAL_API_KEY")
	if expectedApiKey == "" {
		expectedApiKey = "default-internal-key"
	}
	clientApiKey := r.Header.Get("X-Internal-API-Key")
	if clientApiKey != expectedApiKey {
		log.Printf(" Unauthorized complete notification attempt from IP: %s", r.RemoteAddr)
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	if r.Method != http.MethodPost {
		utils.RespondJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	type CompleteRequest struct {
		CollegeName string `json:"college_name"`
	}

	var req CompleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
		return
	}

	if req.CollegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "college_name is required"})
		return
	}

	collegesvc.NotifyPipelineComplete(req.CollegeName)

	log.Printf(" Pipeline complete notification received and broadcasted for: %s", req.CollegeName)
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Pipeline complete notification received",
	})
}
