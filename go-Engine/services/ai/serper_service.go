package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

const SERPER_API_URL = "https://serpapi.com/search"
const DEFAULT_SERPAPI_KEY = "c138d04299d00500bdf9168ba3a04143fadcae1fab8437f2c4bb9b5437dc24d8"

const (
	// BasicInfoJSONSchema matches models.CollegeStats basic fields
	BasicInfoJSONSchema = `{
		"college_name": "string",
		"short_name": "string",
		"established": "number_or_null",
		"institution_type": "string",
		"country": "string",
		"location": "string",
		"website": "url_or_NA",
		"about": "string",
		"summary": "string",
		"rankings": {
			"nirf_2025": "rank_or_NA",
			"nirf_2024": "rank_or_NA",
			"qs_world": "string_or_NA",
			"the_world": "string_or_NA",
			"national_rank": "string_or_NA",
			"state_rank": "string_or_NA",
			"guessed_data": false
		},
		"student_statistics": {
			"total_enrollment": "number_or_null",
			"ug_students": "number_or_null",
			"pg_students": "number_or_null",
			"phd_students": "number_or_null",
			"annual_intake": "number_or_null",
			"male_percent": "number_or_null",
			"female_percent": "number_or_null",
			"total_ug_courses": "number_or_null",
			"total_pg_courses": "number_or_null",
			"total_phd_courses": "number_or_null"
		},
		"faculty_staff": {
			"total_faculty": "number_or_null",
			"student_faculty_ratio": "number_or_null",
			"phd_faculty_percent": "number_or_null"
		},
		"student_history": {
			"student_count_comparison_last_3_years": [
				{"year": "year_number", "total_enrolled": "number_or_null", "ug": "number_or_null", "pg": "number_or_null", "phd": "number_or_null"}
			],
			"student_gender_ratio": {
				"total_male": "number_or_null",
				"total_female": "number_or_null",
				"male_percent": "number_or_null",
				"female_percent": "number_or_null"
			},
			"international_students": {
				"total_count": "number_or_null",
				"countries_represented": ["string"],
				"international_percent": "number_or_null"
			},
			"faculty_achievements": "string_or_NA"
		},
		"accreditations": [{"body": "string", "grade": "string", "year": "number_or_null"}],
		"campus_area": "string_or_NA",
		"contact_info": {"phone": "string_or_NA", "email": "string_or_NA", "address": "string_or_NA"},
		"sources_verified": ["url"]
	}`

	// ProgramsJSONSchema matches models.CollegeStats program lists
	ProgramsJSONSchema = `{
		"ug_programs": ["string"],
		"pg_programs": ["string"],
		"phd_programs": ["string"],
		"departments": ["string"],
		"sources_verified": ["url"]
	}`

	// PlacementsJSONSchema matches models.PlacementInfo and related lists
	PlacementsJSONSchema = `{
		"placements": {
			"year": "year_number",
			"highest_package": "number_or_null",
			"average_package": "number_or_null",
			"median_package": "number_or_null",
			"package_currency": "INR_USD_GBP_etc",
			"placement_rate_percent": "number_or_null",
			"total_students_placed": "number_or_null",
			"total_companies_visited": "number_or_null",
			"graduate_outcomes_note": "string_or_NA"
		},
		"placement_comparison_last_3_years": [
			{"year": "year_number", "average_package": "number_or_null", "employment_rate_percent": "number_or_null", "package_currency": "string"}
		],
		"gender_based_placement_last_3_years": [
			{"year": "year_number", "male_placed": "number_or_null", "female_placed": "number_or_null", "male_percent": "number_or_null", "female_percent": "number_or_null"}
		],
		"sector_wise_placement_last_3_years": [
			{"year": "year_number", "sector": "string", "companies": ["string"], "percent": "number_or_null"}
		],
		"top_recruiters": ["string"],
		"placement_highlights": "string_or_NA",
		"guessed_data": false
	}`

	// FeesJSONSchema matches models.FeesInfo and models.FeesYearInfo
	FeesJSONSchema = `{
		"fees": {
			"UG": {"per_year": "string_or_NA", "total_course": "string_or_NA", "currency": "string"},
			"PG": {"per_year": "string_or_NA", "total_course": "string_or_NA", "currency": "string"},
			"hostel_per_year": "string_or_NA"
		},
		"fees_by_year": [
			{"year": "year_string", "program_type": "UG_PG", "per_year_local": "string_or_NA", "total_course_local": "string_or_NA", "hostel_per_year_local": "string_or_NA", "currency": "string"}
		],
		"fees_note": "string_or_NA",
		"scholarships_detail": [
			{"name": "string", "amount": "string_or_NA", "eligibility": "string_or_NA", "provider": "string_or_NA"}
		],
		"guessed_data": false
	}`

	// InfrastructureJSONSchema matches infrastructure models
	InfrastructureJSONSchema = `{
		"infrastructure": [{"facility": "string", "details": "string"}],
		"hostel_details": {
			"available": "boolean",
			"boys_capacity": "number_or_null",
			"girls_capacity": "number_or_null",
			"total_capacity": "number_or_null",
			"type": "string_or_NA"
		},
		"library_details": {
			"total_books": "number_or_null",
			"journals": "string_or_NA",
			"e_resources": ["string"],
			"area_sqft": "number_or_null"
		},
		"transport_details": {
			"buses": "number_or_null",
			"routes": "string_or_NA"
		},
		"sources_verified": ["url"],
		"guessed_data": false
	}`

	// ScholarshipsJSONSchema matches models.ScholarshipItem
	ScholarshipsJSONSchema = `{
		"scholarships": [
			{"name": "string", "amount": "string_or_NA", "eligibility": "string_or_NA", "provider": "string_or_NA"}
		],
		"guessed_data": false
	}`
)

func FetchCollegeDataFromSerper(collegeName, country, location string) (map[string]interface{}, error) {
	// Directly fetch basic info using Go-native callSerperAPI, replacing the removed Python endpoint
	basicInfo, err := FetchBasicInfoFromSerper(collegeName, country, location)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch basic info from Serper API: %v", err)
	}

	if basicInfo == nil {
		return nil, fmt.Errorf("no basic info returned for %s", collegeName)
	}

	log.Printf(" Received basic data natively from Serper for: %s", collegeName)

	// Wrap in expected flat format
	result := map[string]interface{}{
		"basic_info":   basicInfo,
		"college_name": collegeName,
		"country":      country,
		"location":     location,
	}
	return result, nil
}

func callSerperAPI(query, apiKey string) (interface{}, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", SERPER_API_URL, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Add("engine", "google_ai_mode")
	q.Add("q", query)
	q.Add("api_key", apiKey)
	req.URL.RawQuery = q.Encode()

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var raw map[string]interface{}
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, fmt.Errorf("failed to parse SerpApi response: %v", err)
	}

	var answer string
	if aiRes, ok := raw["reconstructed_markdown"].(string); ok {
		answer = aiRes
	} else if aiRes, ok := raw["answer"].(string); ok {
		answer = aiRes
	} else if answerBox, ok := raw["answer_box"].(map[string]interface{}); ok {
		if aiRes, ok := answerBox["answer"].(string); ok {
			answer = aiRes
		}
	}

	if answer == "" {
		log.Printf(" SerpApi response missing searchable content. Full body: %s", string(body))
		return nil, fmt.Errorf("could not find answer in SerpApi response")
	}

	// Robust JSON extraction matching extract_structured_json in serper.py
	text := answer

	// 1. Strip all code block markers
	re := regexp.MustCompile("(?i)```(?:json)?")
	text = re.ReplaceAllString(text, "")
	text = strings.TrimSpace(text)

	// 2. Find first { and last }
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")

	var jsonStr string
	if start != -1 && end != -1 && end > start {
		jsonStr = text[start : end+1]
	} else {
		jsonStr = text
	}

	// 3. Clean common LLM formatting issues
	jsonStr = strings.ReplaceAll(jsonStr, "\\_", "_")
	jsonStr = strings.ReplaceAll(jsonStr, "\\-", "-")
	jsonStr = strings.ReplaceAll(jsonStr, "\\[", "[")
	jsonStr = strings.ReplaceAll(jsonStr, "\\]", "]")
	jsonStr = strings.ReplaceAll(jsonStr, "\\(", "(")
	jsonStr = strings.ReplaceAll(jsonStr, "\\)", ")")
	jsonStr = strings.ReplaceAll(jsonStr, "\\~", "~")
	jsonStr = strings.ReplaceAll(jsonStr, "\\*", "*")
	jsonStr = strings.ReplaceAll(jsonStr, "\\#", "#")
	jsonStr = strings.ReplaceAll(jsonStr, "\\!", "!")

	// 4. Handle unescaped control characters (like literal newlines in strings)
	// Match extract_structured_json's strict=False behavior
	jsonStr = strings.ReplaceAll(jsonStr, "\n", " ")
	jsonStr = strings.ReplaceAll(jsonStr, "\r", "")
	jsonStr = strings.ReplaceAll(jsonStr, "\t", " ")

	// Remove any double spaces created
	for strings.Contains(jsonStr, "  ") {
		jsonStr = strings.ReplaceAll(jsonStr, "  ", " ")
	}

	jsonStr = strings.TrimSpace(jsonStr)

	// Log for debugging
	log.Printf(" Extracted JSON snippet: %s", jsonStr[:min(200, len(jsonStr))])

	var finalData interface{}
	if err := json.Unmarshal([]byte(jsonStr), &finalData); err != nil {
		log.Printf(" Failed to parse JSON from Serper markdown: %v", err)
		log.Printf(" Extracted string that failed: %s", jsonStr)
		return nil, err
	}

	return finalData, nil
}

// FetchSectionFromSerper fetches a specific section using consistent JSON schemas
func FetchSectionFromSerper(section, collegeName, country, location string) (map[string]interface{}, error) {
	var query string

	// Use new prompts from PHASE2_SECTIONS if available
	if p, ok := PHASE2_SECTIONS[section]; ok {
		query = p
	} else {
		return nil, nil
	}

	q := strings.ReplaceAll(query, "%COLLEGE_NAME%", collegeName)
	q = strings.ReplaceAll(q, "%COUNTRY%", country)
	q = strings.ReplaceAll(q, "%LOCATION%", location)

	apiKey := os.Getenv("SERPAPI_API_KEY")
	if apiKey == "" {
		apiKey = "31a3f75b82c39bfe505a258d37be5f5e6ba8cf628314cce1c9c8d12e1ca92078"
	}

	data, err := callSerperAPI(q, apiKey)
	if err != nil {
		return nil, err
	}

	if dataMap, ok := data.(map[string]interface{}); ok {
		return dataMap, nil
	}
	return nil, nil
}

func FetchBasicInfoFromSerper(collegeName, country, location string) (map[string]interface{}, error) {
	return FetchSectionFromSerper("basic_info", collegeName, country, location)
}

func FetchProgramsFromSerper(collegeName, country, location string) (map[string]interface{}, error) {
	return FetchSectionFromSerper("programs", collegeName, country, location)
}

func FetchPlacementsFromSerper(collegeName, country, location string) (map[string]interface{}, error) {
	return FetchSectionFromSerper("placements", collegeName, country, location)
}

func FetchFeesFromSerper(collegeName, country, location string) (map[string]interface{}, error) {
	return FetchSectionFromSerper("fees", collegeName, country, location)
}

func FetchInfrastructureFromSerper(collegeName, country, location string) (map[string]interface{}, error) {
	return FetchSectionFromSerper("infrastructure", collegeName, country, location)
}

func FetchScholarshipsFromSerper(collegeName, country, location string) (map[string]interface{}, error) {
	return FetchSectionFromSerper("scholarships", collegeName, country, location)
}
