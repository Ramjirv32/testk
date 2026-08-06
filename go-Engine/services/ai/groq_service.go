package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"gobackend/models"
)

func FetchCollegeDataFromGroq(collegeName string) (*models.CollegeStats, error) {
	startTime := time.Now()

	collegeName = strings.TrimSpace(collegeName)
	collegeName = strings.ToLower(collegeName)
	collegeName = strings.ReplaceAll(collegeName, "  ", " ")

	parts := strings.Split(collegeName, " ")
	if len(parts) > 0 {
		countries := []string{"india", "usa", "uk", "australia", "canada", "russia", "china", "japan", "germany", "france", "bangladesh"}
		lastWord := parts[len(parts)-1]
		for _, country := range countries {
			if lastWord == country {
				parts = parts[:len(parts)-1]
				break
			}
		}
		collegeName = strings.Join(parts, " ")
	}
	collegeName = strings.ToTitle(collegeName)

	log.Printf(" Cleaned college name: %s", collegeName)
	log.Printf(" Fetching data for: %s using Groq", collegeName)

	if cachedData, found := GetFromCache(collegeName); found {
		log.Printf(" Cache HIT for: %s", collegeName)
		return cachedData, nil
	}

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		log.Printf(" GROQ_API_KEY not set in environment")
		return nil, fmt.Errorf("GROQ_API_KEY not set in .env file")
	}

	prompt := GetPhase1Prompt(collegeName)

	groqReq := GroqRequest{
		Model: GROQ_MODEL_ID,
		Messages: []GroqMessage{
			{
				Role:    "system",
				Content: "You are a structured data extraction assistant. You MUST respond with ONLY a valid JSON object. No preamble, no explanation, no markdown, no code fences. Start your response with { and end with }. make sure to give accurate and  correct data",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.1,
	}

	reqBody, err := json.Marshal(groqReq)
	if err != nil {
		log.Printf(" Failed to marshal Groq request: %v", err)
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		log.Printf(" Failed to create HTTP request: %v", err)
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf(" Groq API request failed: %v", err)
		return nil, fmt.Errorf("failed to call Groq API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf(" Failed to read response body: %v", err)
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf(" Groq API error (status %d): %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("Groq API error: %s", string(body))
	}

	var groqResp GroqResponse
	if err := json.Unmarshal(body, &groqResp); err != nil {
		log.Printf(" Failed to parse Groq response: %v", err)
		log.Printf("Response body: %s", string(body))
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(groqResp.Choices) == 0 {
		log.Printf(" Empty response from Groq")
		return nil, fmt.Errorf("empty response from Groq")
	}

	text := groqResp.Choices[0].Message.Content
	text = CleanJSON(text)

	var data map[string]interface{}
	if err := json.Unmarshal([]byte(text), &data); err != nil {
		log.Printf(" JSON Parse Error: %v", err)
		log.Printf("Response text: %s", text)
		return nil, fmt.Errorf("failed to parse Groq response: %w", err)
	}

	stats := MapMapToCollegeStats(data)

	elapsedTime := time.Since(startTime)
	log.Printf(" Successfully fetched data for: %s using Groq ( %dms)", stats.CollegeName, elapsedTime.Milliseconds())

	SaveToCache(collegeName, stats)

	return stats, nil
}

// ============================================================================
// PARALLEL BATCH FETCHING - Phase 1 + Phase 2 Sections in Parallel
// ============================================================================

func FetchPhase1FromGroq(collegeName string) (map[string]interface{}, error) {
	log.Printf(" [Groq Phase1] Fetching core info for: %s", collegeName)

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GROQ_API_KEY not set")
	}

	prompt := GetPhase1Prompt(collegeName)
	groqReq := GroqRequest{
		Model: GROQ_MODEL_ID,
		Messages: []GroqMessage{
			{Role: "system", Content: "You are a structured data extraction assistant. You MUST respond with ONLY a valid JSON object. No preamble, no explanation, no markdown, no code fences. Start your response with { and end with }. maek sur to give accraute correct data"},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.1,
	}

	reqBody, _ := json.Marshal(groqReq)
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		log.Printf(" [Groq Phase1] Request failed: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		log.Printf(" [Groq Phase1] API error: %s", string(body))
		return nil, fmt.Errorf("groq api error")
	}

	var groqResp GroqResponse
	json.Unmarshal(body, &groqResp)
	if len(groqResp.Choices) == 0 {
		return nil, fmt.Errorf("empty groq response")
	}

	text := CleanJSON(groqResp.Choices[0].Message.Content)
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(text), &data); err != nil {
		// Try to fix incomplete JSON
		log.Printf(" [Groq Phase1] Initial parse failed: %v, attempting to fix...", err)
		text = FixIncompleteJSON(text)

		if err := json.Unmarshal([]byte(text), &data); err != nil {
			log.Printf(" [Groq Phase1] JSON parse error after fixing: %v", err)
			return nil, err
		}
		log.Printf(" [Groq Phase1] JSON fixed and parsed")
	}

	log.Printf(" [Groq Phase1] Completed for: %s", collegeName)
	return data, nil
}

func FetchSectionFromGroq(section, collegeName string) (map[string]interface{}, error) {
	log.Printf(" [Groq %s] Fetching from Groq...", section)

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GROQ_API_KEY not set")
	}

	prompt := GetPhase2Prompt(section, collegeName)
	if prompt == "" {
		return nil, fmt.Errorf("unknown section: %s", section)
	}

	groqReq := GroqRequest{
		Model: GROQ_MODEL_ID,
		Messages: []GroqMessage{
			{Role: "system", Content: "You are a structured data extraction assistant. You MUST respond with ONLY a valid JSON object. No preamble, no explanation, no markdown, no code fences. Start your response with { and end with }. maek sur to give accraute correct data"},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.1,
	}

	reqBody, _ := json.Marshal(groqReq)
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		log.Printf(" [Groq %s] Request failed: %v", section, err)
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		log.Printf(" [Groq %s] API error", section)
		return nil, fmt.Errorf("groq api error")
	}

	var groqResp GroqResponse
	json.Unmarshal(body, &groqResp)
	if len(groqResp.Choices) == 0 {
		return nil, fmt.Errorf("empty response")
	}

	text := CleanJSON(groqResp.Choices[0].Message.Content)
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(text), &data); err != nil {
		// Try to fix incomplete JSON
		log.Printf(" [Groq %s] Initial parse failed: %v, attempting to fix...", section, err)
		text = FixIncompleteJSON(text)

		if err := json.Unmarshal([]byte(text), &data); err != nil {
			log.Printf(" [Groq %s] JSON parse error after fixing: %v", section, err)
			return nil, err
		}
		log.Printf(" [Groq %s] JSON fixed and parsed", section)
	}

	log.Printf(" [Groq %s] Completed", section)
	return data, nil
}

func FetchAllBatchesFromGroq(collegeName string) *models.CollegeStats {
	log.Printf(" Starting parallel Groq batch fetch for: %s", collegeName)

	// Phase1
	phase1Data, err := FetchPhase1FromGroq(collegeName)
	if err != nil || phase1Data == nil {
		log.Printf(" Phase1 failed")
		return nil
	}

	stats := MapMapToCollegeStats(phase1Data)
	stats.ApprovalStatus = "pending"

	// Parallel Phase2 sections
	var wg sync.WaitGroup
	var mu sync.Mutex
	sections := []string{"programs", "placements", "fees", "infrastructure"}
	for _, section := range sections {
		wg.Add(1)
		go func(sec string) {
			defer wg.Done()
			sectionData, err := FetchSectionFromGroq(sec, stats.CollegeName)
			if err != nil {
				log.Printf(" Section %s fetch failed: %v", sec, err)
				return
			}

			log.Printf(" [Groq] Merging section: %s", sec)
			mu.Lock()
			MergeSectionData(stats, sec, sectionData)
			mu.Unlock()
		}(section)
	}

	wg.Wait()

	SyncLegacyFields(stats)
	SaveToCache(stats.CollegeName, stats)

	log.Printf(" [Groq] All batches completed for: %s", stats.CollegeName)
	return stats
}

func MergeSectionData(stats *models.CollegeStats, section string, data map[string]interface{}) {
	switch section {
	case "programs":
		stats.UGPrograms = GetStringSlice(data, "ug_programs")
		stats.PGPrograms = GetStringSlice(data, "pg_programs")
		stats.PhDPrograms = GetStringSlice(data, "phd_programs")
		stats.Departments = GetStringSlice(data, "departments")

	case "placements":
		if pl, ok := data["placements"].(map[string]interface{}); ok {
			stats.Placements = models.PlacementInfo{
				Year:                  GetInt(pl, "year"),
				HighestPackage:        GetFloat(pl, "highest_package"),
				AveragePackage:        GetFloat(pl, "average_package"),
				MedianPackage:         GetFloat(pl, "median_package"),
				PackageCurrency:       GetString(pl, "package_currency"),
				PlacementRatePercent:  GetFloat(pl, "placement_rate_percent"),
				TotalStudentsPlaced:   GetInt(pl, "total_students_placed"),
				TotalCompaniesVisited: GetInt(pl, "total_companies_visited"),
				GraduateOutcomesNote:  GetString(pl, "graduate_outcomes_note"),
			}
		}
		stats.TopRecruiters = GetStringSlice(data, "top_recruiters")
		stats.PlacementHighlights = GetString(data, "placement_highlights")

		// Comparisons
		pc := GetSlice(data, "placement_comparison_last_3_years")
		for _, raw := range pc {
			if m, ok := raw.(map[string]interface{}); ok {
				stats.PlacementComparison = append(stats.PlacementComparison, models.PlacementComp{
					Year:                  GetInt(m, "year"),
					AveragePackage:        GetFloat(m, "average_package"),
					EmploymentRatePercent: GetFloat(m, "employment_rate_percent"),
					PackageCurrency:       GetString(m, "package_currency"),
				})
			}
		}

		// Gender-based placement
		gp := GetSlice(data, "gender_based_placement_last_3_years")
		for _, raw := range gp {
			if m, ok := raw.(map[string]interface{}); ok {
				stats.GenderPlacement = append(stats.GenderPlacement, models.GenderPlacement{
					Year:          GetInt(m, "year"),
					MalePlaced:    m["male_placed"],
					FemalePlaced:  m["female_placed"],
					MalePercent:   m["male_percent"],
					FemalePercent: m["female_percent"],
				})
			}
		}

		// Sector-wise placement
		sp := GetSlice(data, "sector_wise_placement_last_3_years")
		for _, raw := range sp {
			if m, ok := raw.(map[string]interface{}); ok {
				stats.SectorPlacement = append(stats.SectorPlacement, models.SectorPlacement{
					Year:      GetInt(m, "year"),
					Sector:    GetString(m, "sector"),
					Companies: GetString(m, "companies"),
					Percent:   m["percent"],
				})
			}
		}

	case "fees":
		if fs, ok := data["fees"].(map[string]interface{}); ok {
			stats.Fees = models.FeesInfo{
				UG: models.FeeGroup{
					PerYear:     GetString(GetMap(fs, "UG"), "per_year"),
					TotalCourse: GetString(GetMap(fs, "UG"), "total_course"),
					Currency:    GetString(GetMap(fs, "UG"), "currency"),
				},
				PG: models.FeeGroup{
					PerYear:     GetString(GetMap(fs, "PG"), "per_year"),
					TotalCourse: GetString(GetMap(fs, "PG"), "total_course"),
					Currency:    GetString(GetMap(fs, "PG"), "currency"),
				},
				HostelPerYear: GetString(fs, "hostel_per_year"),
			}
		}
		stats.FeesNote = GetString(data, "fees_note")

		// fees_by_year
		fy := GetSlice(data, "fees_by_year")
		for _, raw := range fy {
			if m, ok := raw.(map[string]interface{}); ok {
				stats.FeesByYear = append(stats.FeesByYear, models.FeesYearInfo{
					Year: GetString(m, "year"),
					UG: models.FeeGroup{
						PerYear:     GetString(m, "UG.per_year"),
						TotalCourse: GetString(m, "UG.total_course"),
						Currency:    GetString(m, "UG.currency"),
					},
					PG: models.FeeGroup{
						PerYear:     GetString(m, "PG.per_year"),
						TotalCourse: GetString(m, "PG.total_course"),
						Currency:    GetString(m, "PG.currency"),
					},
					PhD: models.FeeGroup{
						PerYear:     GetString(m, "PhD.per_year"),
						TotalCourse: GetString(m, "PhD.total_course"),
						Currency:    GetString(m, "PhD.currency"),
					},
					HostelPerYear: GetFloat(m, "hostel_per_year"),
				})
			}
		}

		// Scholarships — check both key variants
		schRaw := data["scholarships_detail"]
		if schRaw == nil {
			schRaw = data["scholarships"]
		}
		if schSlice, ok := schRaw.([]interface{}); ok {
			for _, raw := range schSlice {
				if m, ok := raw.(map[string]interface{}); ok {
					stats.ScholarshipsDetail = append(stats.ScholarshipsDetail, models.ScholarshipItem{
						Name:        GetString(m, "name"),
						Amount:      GetString(m, "amount"),
						Eligibility: GetString(m, "eligibility"),
						Provider:    GetString(m, "provider"),
					})
				}
			}
		}

	case "infrastructure":
		inf := GetSlice(data, "infrastructure")
		for _, raw := range inf {
			if m, ok := raw.(map[string]interface{}); ok {
				stats.Infrastructure = append(stats.Infrastructure, models.InfraItem{
					Facility: GetString(m, "facility"),
					Details:  GetString(m, "details"),
				})
			}
		}

		if hd, ok := data["hostel_details"].(map[string]interface{}); ok {
			stats.HostelDetails = models.HostelDetails{
				Available:     GetBool(hd, "available"),
				BoysCapacity:  hd["boys_capacity"],
				GirlsCapacity: hd["girls_capacity"],
				TotalCapacity: hd["total_capacity"],
				Type:          GetString(hd, "type"),
			}
		}

		if ld, ok := data["library_details"].(map[string]interface{}); ok {
			stats.LibraryDetails = models.LibraryDetails{
				TotalBooks: GetString(ld, "total_books"),
				Journals:   GetString(ld, "journals"),
				EResources: GetString(ld, "e_resources"),
				AreaSqft:   GetString(ld, "area_sqft"),
			}
		}

		if td, ok := data["transport_details"].(map[string]interface{}); ok {
			stats.TransportDetails = models.TransportDetails{
				Buses:  GetString(td, "buses"),
				Routes: GetString(td, "routes"),
			}
		}
	}
}

// CallGroqForValidation sends a validation request to Groq and parses the response
func CallGroqForValidation(prompt string) (models.CollegeValidationResponse, error) {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return models.CollegeValidationResponse{
			IsValid: false,
			Error:   "GROQ_API_KEY not configured",
		}, fmt.Errorf("GROQ_API_KEY not set in environment")
	}

	groqReq := GroqRequest{
		Model: GROQ_MODEL_ID,
		Messages: []GroqMessage{
			{
				Role:    "system",
				Content: "You are a college name validation expert. You MUST respond with ONLY a valid JSON object. No preamble, no explanation, no markdown, no code fences. Start with { and end with }.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.1,
	}

	reqBody, err := json.Marshal(groqReq)
	if err != nil {
		return models.CollegeValidationResponse{
			IsValid: false,
			Error:   "Failed to marshal request",
		}, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return models.CollegeValidationResponse{
			IsValid: false,
			Error:   "Failed to create HTTP request",
		}, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return models.CollegeValidationResponse{
			IsValid: false,
			Error:   "Groq API request failed",
		}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return models.CollegeValidationResponse{
			IsValid: false,
			Error:   "Failed to read response",
		}, err
	}

	var groqResp GroqResponse
	if err := json.Unmarshal(body, &groqResp); err != nil {
		log.Printf(" Failed to parse Groq response: %v. Body: %s", err, string(body))
		return models.CollegeValidationResponse{
			IsValid: false,
			Error:   "Failed to parse Groq response",
		}, err
	}

	if len(groqResp.Choices) == 0 {
		return models.CollegeValidationResponse{
			IsValid: false,
			Error:   "No response from Groq",
		}, fmt.Errorf("empty choices from Groq")
	}

	content := groqResp.Choices[0].Message.Content
	log.Printf(" Groq validation response: %s", content)

	var validationResp models.CollegeValidationResponse
	if err := json.Unmarshal([]byte(content), &validationResp); err != nil {
		log.Printf(" Failed to parse validation JSON: %v", err)
		return models.CollegeValidationResponse{
			IsValid: false,
			Error:   "Failed to parse validation response",
			Reason:  fmt.Sprintf("Invalid JSON: %v", err),
		}, err
	}

	return validationResp, nil
}
