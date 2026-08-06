package collegesvc

import (
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"gobackend/models"
	"gobackend/services/ai"
	"gobackend/services/cache"
	"gobackend/services/realtime"
)

// CollegeValidationRequest is the input from frontend for college validation
type CollegeValidationRequest struct {
	CollegeName string `json:"college_name"`
	Country     string `json:"country"`
	City        string `json:"city"`
}

// CollegeValidationResponse is the validated college info
type CollegeValidationResponse struct {
	Name     string `json:"name"`
	Country  string `json:"country"`
	Location string `json:"location"`
	IsValid  bool   `json:"is_valid"`
	Error    string `json:"error,omitempty"`
	Reason   string `json:"reason,omitempty"`
}

// ---------------------------------------------------------------------------
// Scraping Orchestrator
// ---------------------------------------------------------------------------

var (
	ActiveScrapingFlows = make(map[string]bool)
	ScrapingMutex       sync.Mutex
)

func StartScrapingFlowSync(collegeName, country, location string) *models.CollegeStats {
	requestedName := strings.TrimSpace(collegeName)
	ScrapingMutex.Lock()
	if ActiveScrapingFlows[collegeName] {
		ScrapingMutex.Unlock()
		log.Printf(" Scraping already in progress for: %s", collegeName)
		return nil
	}
	ActiveScrapingFlows[collegeName] = true
	ScrapingMutex.Unlock()

	defer func() {
		ScrapingMutex.Lock()
		delete(ActiveScrapingFlows, collegeName)
		ScrapingMutex.Unlock()
	}()

	log.Printf(" STARTING AI SERVER SCRAPING FLOW for: %s (%s, %s)", collegeName, country, location)

	// Single call to AI Server for all sections + normalization
	normalizedData, err := ai.FetchCollegeDataFromSerper(collegeName, country, location)
	if err != nil {
		log.Printf(" AI Server Scraping failed: %v", err)
		return nil
	}

	// Extract Basic Info for immediate return
	// Handle multiple response formats from Python API
	var basicInfoRaw map[string]interface{}
	var ok bool

	// First check if data is nested under serper_sections (new format from Python API)
	if serperSections, hasSections := normalizedData["serper_sections"].(map[string]interface{}); hasSections {
		basicInfoRaw, ok = serperSections["basic_info"].(map[string]interface{})
		if ok {
			log.Printf(" Extracted basic_info from nested serper_sections")
		}
	}

	// Fall back to flat structure (legacy/direct format)
	if !ok {
		basicInfoRaw, ok = normalizedData["basic_info"].(map[string]interface{})
		if ok {
			log.Printf(" Extracted basic_info from flat structure")
		}
	}

	// If still not found, try to extract from flattened Python API response format
	// where fields are at top level: college_name, country, student_statistics_detail, etc.
	if !ok {
		if collegeName, hasName := normalizedData["college_name"]; hasName {
			log.Printf(" Detected flattened Python API response format")
			basicInfoRaw = make(map[string]interface{})
			// Extract top-level fields that belong in basic_info
			basicInfoRaw["college_name"] = collegeName
			if country, ok := normalizedData["country"]; ok {
				basicInfoRaw["country"] = country
			}
			if location, ok := normalizedData["location"]; ok {
				basicInfoRaw["location"] = location
			}
			if established, ok := normalizedData["established"]; ok {
				basicInfoRaw["established"] = established
			}
			if institutionType, ok := normalizedData["institution_type"]; ok {
				basicInfoRaw["institution_type"] = institutionType
			}
			if summary, ok := normalizedData["summary"]; ok {
				basicInfoRaw["summary"] = summary
			}
			if website, ok := normalizedData["website"]; ok {
				basicInfoRaw["website"] = website
			}
			if about, ok := normalizedData["about"]; ok {
				basicInfoRaw["about"] = about
			}
			// Use detail versions if they exist
			if studentStats, ok := normalizedData["student_statistics_detail"]; ok {
				basicInfoRaw["student_statistics"] = studentStats
			} else if studentStats, ok := normalizedData["student_statistics"]; ok {
				basicInfoRaw["student_statistics"] = studentStats
			}
			if rankings, ok := normalizedData["rankings"]; ok {
				basicInfoRaw["rankings"] = rankings
			}
			ok = true
		}
	}

	if !ok {
		log.Printf(" AI Server response missing basic_info in all formats (nested, flat, flattened)")
		log.Printf("DEBUG: Available keys in normalizedData: %v", getKeys(normalizedData))
		return nil
	}

	// Map to CollegeStats model
	stats := ai.MapMapToCollegeStats(basicInfoRaw)
	stats.ApprovalStatus = "pending"
	stats.CreatedAt = time.Now()
	stats.UpdatedAt = time.Now()
	// Serper resolves aliases such as "KPRIET" to the verified institution.
	// Preserve that identity; use request values only when Serper omitted a field.
	if isMissingCollegeText(stats.CollegeName) {
		stats.CollegeName = requestedName
	}
	if isMissingCollegeText(stats.Country) {
		stats.Country = country
	}
	if isMissingCollegeText(stats.Location) {
		stats.Location = location
	}
	if !strings.EqualFold(stats.CollegeName, requestedName) {
		stats.SearchAliases = []string{requestedName}
	}

	// Update the normalized data with correct basic info
	if normalizedData != nil {
		normalizedData["college_name"] = stats.CollegeName
		normalizedData["country"] = stats.Country
		normalizedData["location"] = stats.Location
	}

	// Save all sections into the model
	stats.SerperSections = normalizedData

	// Save to MongoDB
	if err := SaveCollegeToCache(stats); err != nil {
		log.Printf(" [DB Save] Failed: %v", err)
	}

	// Double-entry Redis save for fast lookup
	rs := cache.NewRedisService()
	rs.SaveCollegeToRedis(stats)
	if stats.CollegeName != collegeName {
		rs.SaveCollegeToRedisWithKey(collegeName, stats)
		ai.SaveToCache(collegeName, stats)
	}
	ai.SaveToCache(stats.CollegeName, stats)

	// Save Serper data organized by year and college name
	// Structure: serper_cache/[YEAR]/[COLLEGE_NAME]/[SECTION].json
	// Also store in MongoDB serper_collection and Redis with keys: serper:[YEAR]:[COLLEGE_NAME]:[SECTION]
	currentYear := time.Now().Year()
	if normalizedData != nil {
		for section, sectionData := range normalizedData {
			if sectionDataMap, ok := sectionData.(map[string]interface{}); ok {
				if err := SaveSerperDataByYear(stats.CollegeName, currentYear, section, sectionDataMap); err != nil {
					log.Printf(" [Serper Storage] Failed to save section %s: %v", section, err)
				} else {
					log.Printf(" [Serper Storage] Saved section %s for college %s (year %d)", section, stats.CollegeName, currentYear)
				}
			}
		}
	}

	log.Printf(" AI SERVER FLOW COMPLETE for: %s", stats.CollegeName)
	return stats
}

func isMissingCollegeText(value string) bool {
	clean := strings.ToLower(strings.TrimSpace(value))
	switch clean {
	case "", "n/a", "na", "unknown", "null", "none", "<nil>":
		return true
	default:
		return false
	}
}

// ValidateCollegeName uses Groq to validate and normalize college names
// Input: partial college name + country + location
// Output: exact college name, verified country, verified location
func ValidateCollegeName(req CollegeValidationRequest) CollegeValidationResponse {
	log.Printf(" Validating college name: %s (Country: %s, Location: %s)", req.CollegeName, req.Country, req.City)

	collegeName := strings.TrimSpace(req.CollegeName)
	country := strings.TrimSpace(req.Country)
	location := strings.TrimSpace(req.City)

	if collegeName == "" {
		return CollegeValidationResponse{
			IsValid: false,
			Error:   "College name cannot be empty",
			Reason:  "No college name provided",
		}
	}

	// Try to find in database first (case-insensitive)
	dbCollege, dbErr := GetCollegeFromCache(collegeName)
	if dbErr == nil && dbCollege != nil {
		log.Printf(" College found in database: %s", dbCollege.CollegeName)
		return CollegeValidationResponse{
			IsValid:  true,
			Name:     dbCollege.CollegeName,
			Country:  dbCollege.Country,
			Location: dbCollege.Location,
		}
	}

	// If not in DB, use Groq to validate
	log.Printf(" College not in database, using Groq for validation...")

	prompt := buildCollegeValidationPrompt(collegeName, country, location)

	resp, err := ai.CallGroqForValidation(prompt)
	if err != nil {
		log.Printf(" Groq validation failed: %v", err)
		return CollegeValidationResponse{
			IsValid: false,
			Error:   "Failed to validate college name",
			Reason:  fmt.Sprintf("Groq API error: %v", err),
		}
	}

	// Try to parse Groq response
	if resp.IsValid {
		log.Printf(" College validated by Groq: %s (%s, %s)", resp.Name, resp.Country, resp.Location)
	} else {
		log.Printf(" College not found by Groq: %s", resp.Reason)
	}

	// Convert models response to local response type
	return CollegeValidationResponse{
		Name:     resp.Name,
		Country:  resp.Country,
		Location: resp.Location,
		IsValid:  resp.IsValid,
		Error:    resp.Error,
		Reason:   resp.Reason,
	}
}

// buildCollegeValidationPrompt creates the Groq prompt for college validation
func buildCollegeValidationPrompt(collegeName, country, location string) string {
	return fmt.Sprintf(`You are a college name validation expert. Your task is to validate and normalize college names.

Given Input:
- College Name (possibly partial or abbreviated): "%s"
- Country: "%s"
- Location/City: "%s"

Task:
1. Identify if this is a real/known college
2. Return the EXACT official full name as per official sources
3. Verify the country and location are correct
4. If the name is an abbreviation (PSG, NUS, IIT, etc.), expand to full name

Return ONLY valid JSON (no markdown, no explanation):
{
  "is_valid": true/false,
  "name": "exact official college name",
  "country": "full country name",
  "location": "city/location",
  "reason": "brief reason if not valid"
}

Examples:
- Input: "PSG", "India", "Tamil Nadu" → {"is_valid": true, "name": "PSG College of Technology", "country": "India", "location": "Coimbatore"}
- Input: "NUS", "Singapore", "Singapore" → {"is_valid": true, "name": "National University of Singapore", "country": "Singapore", "location": "Singapore"}
- Input: "IIT", "India", "Chennai" → {"is_valid": true, "name": "Indian Institute of Technology Madras", "country": "India", "location": "Chennai"}
- Input: "XYZ College", "Unknown", "" → {"is_valid": false, "name": "", "country": "", "location": "", "reason": "College not found in known institutions"}`, collegeName, country, location)
}

func NotifyPipelineComplete(officialName string) {
	NotifyPipelineCompleteWithID(officialName, "")
}

func NotifyPipelineCompleteWithID(officialName, pipelineID string) {
	log.Printf(" [Scraper Complete] Notifying clients that pipeline is complete for: %s", officialName)
	realtime.BroadcastCollegeScrapingUpdate(officialName, "pipeline_complete", map[string]interface{}{
		"college_name": officialName,
		"pipeline_id":  pipelineID,
	})
}
