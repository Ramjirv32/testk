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
	"regexp"
	"strings"
	"time"

	"gobackend/models"
)

func CleanJSON(text string) string {
	text = strings.TrimSpace(text)

	// Remove markdown code blocks (```json ... ```)
	re := regexp.MustCompile("(?is)^```(?:json|JSON)?\\s*(.*?)\\s*```$")
	match := re.FindStringSubmatch(text)
	if len(match) > 1 {
		text = match[1]
	}

	// Remove any remaining backticks
	text = strings.ReplaceAll(text, "`", "")

	// Extract JSON object - find first { and last }
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start != -1 && end != -1 && end > start {
		text = text[start : end+1]
	} else if start != -1 {
		// No closing brace (truncated response) — at least strip prefix
		text = text[start:]
	}

	// Fix unquoted N/A, N/a, n/a values (LLMs sometimes write: "field": N/A instead of "field": "N/A")
	reNA := regexp.MustCompile(`(?i):\s*(N/A|Not Applicable|None|Nil)\b`)
	text = reNA.ReplaceAllStringFunc(text, func(m string) string {
		// Extract the value part after the colon
		colon := strings.Index(m, ":")
		val := strings.TrimSpace(m[colon+1:])
		return `: "` + val + `"`
	})

	// Fix unquoted true/false/null that might have been written as True/False/Null (Python-style)
	reBool := regexp.MustCompile(`:\s*(True|False|Null)\b`)
	text = reBool.ReplaceAllStringFunc(text, func(m string) string {
		colon := strings.Index(m, ":")
		val := strings.TrimSpace(m[colon+1:])
		return `: ` + strings.ToLower(val)
	})

	// Remove trailing commas before closing braces or brackets
	reComma := regexp.MustCompile(`,(\s*[}\]])`)
	text = reComma.ReplaceAllString(text, "$1")

	// Remove control characters
	reCtrl := regexp.MustCompile(`[\x00-\x08\x0b\x0c\x0e-\x1f]`)
	text = reCtrl.ReplaceAllString(text, " ")

	// Trim whitespace again
	text = strings.TrimSpace(text)

	return text
}

// isGarbageResponse returns true if the text is all-zero bytes, whitespace-only,
// or contains no valid JSON-starting character — indicating a corrupt Gemini response.
func isGarbageResponse(text string) bool {
	if len(text) == 0 {
		return true
	}
	allZero := true
	for _, c := range text {
		if c != '0' && c != ' ' && c != '\n' && c != '\r' && c != '\t' {
			allZero = false
			break
		}
	}
	if allZero {
		return true
	}
	// Must start with { or [ after trimming
	trimmed := strings.TrimSpace(text)
	return len(trimmed) == 0 || (trimmed[0] != '{' && trimmed[0] != '[')
}

func FetchSectionFromGemini(section, collegeName string) (map[string]interface{}, error) {
	const maxRetries = 3
	for attempt := 1; attempt <= maxRetries; attempt++ {
		if attempt > 1 {
			log.Printf(" [Gemini %s] Retry attempt %d/%d...", section, attempt, maxRetries)
			time.Sleep(time.Duration(attempt) * 2 * time.Second)
		} else {
			log.Printf(" [Gemini %s] Fetching from Gemini...", section)
		}

		data, err := fetchSectionFromGeminiOnce(section, collegeName)
		if err == nil {
			return data, nil
		}
		log.Printf(" [Gemini %s] Attempt %d failed: %v", section, attempt, err)
	}
	return nil, fmt.Errorf("[Gemini %s] all %d attempts failed", section, maxRetries)
}

func fetchSectionFromGeminiOnce(section, collegeName string) (map[string]interface{}, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY not set")
	}

	prompt := GetPhase2Prompt(section, collegeName)
	if prompt == "" {
		return nil, fmt.Errorf("unknown section: %s", section)
	}

	geminiReq := GeminiRequest{
		Contents: []struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		}{
			{
				Parts: []struct {
					Text string `json:"text"`
				}{
					{Text: prompt},
				},
			},
		},
		GenerationConfig: struct {
			Temperature     float64 `json:"temperature"`
			MaxOutputTokens int     `json:"maxOutputTokens"`
		}{
			Temperature:     0.1,
			MaxOutputTokens: 8192,
		},
	}

	reqBody, _ := json.Marshal(geminiReq)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", GEMINI_MODEL_ID, apiKey)
	req, _ := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		log.Printf(" [Gemini %s] Request failed: %v", section, err)
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		log.Printf(" [Gemini %s] API error (status %d)", section, resp.StatusCode)
		return nil, fmt.Errorf("gemini api error: status %d", resp.StatusCode)
	}

	var geminiResp GeminiResponse
	json.Unmarshal(body, &geminiResp)
	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		log.Printf(" [Gemini %s] Empty response", section)
		return nil, fmt.Errorf("empty gemini response")
	}

	text := CleanJSON(geminiResp.Candidates[0].Content.Parts[0].Text)
	log.Printf(" [Gemini %s] Cleaned text length: %d chars", section, len(text))

	// Detect all-zero / garbage binary responses
	if isGarbageResponse(text) {
		log.Printf(" [Gemini %s] Garbage response detected (all-zeros or non-JSON), will retry", section)
		return nil, fmt.Errorf("garbage response")
	}

	var data map[string]interface{}
	if err := json.Unmarshal([]byte(text), &data); err != nil {
		// Try to fix incomplete JSON by adding missing closing braces
		log.Printf(" [Gemini %s] Initial parse failed: %v, attempting to fix...", section, err)
		text = FixIncompleteJSON(text)

		// Retry parsing
		if err := json.Unmarshal([]byte(text), &data); err != nil {
			log.Printf(" [Gemini %s] JSON parse error after fixing: %v", section, err)
			log.Printf(" Text: %s", text[:min(len(text), 200)])
			return nil, err
		}
		log.Printf(" [Gemini %s] JSON fixed and parsed successfully", section)
	}

	log.Printf(" [Gemini %s] Completed", section)
	return data, nil
}

func IsStructureValid(section string, data map[string]interface{}) bool {
	switch section {
	case "programs":
		// Must have: ug_programs, pg_programs, phd_programs, departments
		_, hasUG := data["ug_programs"]
		_, hasPG := data["pg_programs"]
		_, hasPhD := data["phd_programs"]
		_, hasDept := data["departments"]
		return hasUG || hasPG || hasPhD || hasDept

	case "placements":
		// Must have: placements object with core fields
		_, hasPlace := data["placements"]
		_, hasComparison := data["placement_comparison_last_3_years"]
		_, hasRecruit := data["top_recruiters"]
		return hasPlace || hasComparison || hasRecruit

	case "fees":
		// Must have: fees object
		_, hasFees := data["fees"]
		_, hasScholar := data["scholarships"]
		return hasFees || hasScholar

	case "infrastructure":
		// Must have: infrastructure or hostel_details or library_details
		_, hasInfra := data["infrastructure"]
		_, hasHostel := data["hostel_details"]
		_, hasLib := data["library_details"]
		return hasInfra || hasHostel || hasLib

	case "general":
		// Must have core fields
		_, hasName := data["college_name"]
		_, hasStats := data["student_statistics"]
		_, hasRankks := data["rankings"]
		return hasName || hasStats || hasRankks

	default:
		return false
	}
}

// HasSectionChanged compares the Gemini section data against the existing
// in-memory cache. Returns true if data is meaningfully different.
func HasSectionChanged(existing *models.CollegeStats, section string, newData map[string]interface{}) bool {
	newStats := MapMapToCollegeStats(newData)
	switch section {
	case "general":
		if existing.CollegeName != newStats.CollegeName ||
			existing.Website != newStats.Website ||
			existing.Established != newStats.Established ||
			existing.InstitutionType != newStats.InstitutionType ||
			existing.Country != newStats.Country ||
			existing.Location != newStats.Location ||
			existing.About != newStats.About ||
			existing.Summary != newStats.Summary ||
			fmt.Sprintf("%v", existing.Rankings.NIRF2025) != fmt.Sprintf("%v", newStats.Rankings.NIRF2025) ||
			fmt.Sprintf("%v", existing.Rankings.NIRF2024) != fmt.Sprintf("%v", newStats.Rankings.NIRF2024) ||
			fmt.Sprintf("%v", existing.Rankings.QSWorld) != fmt.Sprintf("%v", newStats.Rankings.QSWorld) ||
			fmt.Sprintf("%v", existing.Rankings.NationalRank) != fmt.Sprintf("%v", newStats.Rankings.NationalRank) ||
			fmt.Sprintf("%v", existing.Rankings.StateRank) != fmt.Sprintf("%v", newStats.Rankings.StateRank) ||
			existing.StudentStatsDetail.TotalEnrollment != newStats.StudentStatsDetail.TotalEnrollment ||
			existing.StudentStatsDetail.UGStudents != newStats.StudentStatsDetail.UGStudents ||
			existing.StudentStatsDetail.PGStudents != newStats.StudentStatsDetail.PGStudents ||
			existing.StudentStatsDetail.PhDStudents != newStats.StudentStatsDetail.PhDStudents ||
			existing.StudentStatsDetail.AnnualIntake != newStats.StudentStatsDetail.AnnualIntake ||
			existing.FacultyStaffDetail.TotalFaculty != newStats.FacultyStaffDetail.TotalFaculty ||
			existing.FacultyStaffDetail.StudentFacultyRatio != newStats.FacultyStaffDetail.StudentFacultyRatio ||
			existing.FacultyStaffDetail.PhDFacultyPercent != newStats.FacultyStaffDetail.PhDFacultyPercent ||
			len(existing.Accreditations) != len(newStats.Accreditations) ||
			len(existing.Affiliations) != len(newStats.Affiliations) ||
			existing.Recognition != newStats.Recognition ||
			existing.CampusArea != newStats.CampusArea ||
			existing.ContactInfo.Phone != newStats.ContactInfo.Phone ||
			existing.ContactInfo.Email != newStats.ContactInfo.Email ||
			existing.ContactInfo.Address != newStats.ContactInfo.Address {
			return true
		}
	case "programs":
		if len(existing.UGPrograms) != len(newStats.UGPrograms) ||
			len(existing.PGPrograms) != len(newStats.PGPrograms) ||
			len(existing.PhDPrograms) != len(newStats.PhDPrograms) ||
			len(existing.Departments) != len(newStats.Departments) {
			return true
		}
	case "placements":
		if existing.Placements.AveragePackage != newStats.Placements.AveragePackage ||
			existing.Placements.HighestPackage != newStats.Placements.HighestPackage ||
			existing.Placements.MedianPackage != newStats.Placements.MedianPackage ||
			existing.Placements.PlacementRatePercent != newStats.Placements.PlacementRatePercent ||
			existing.Placements.TotalStudentsPlaced != newStats.Placements.TotalStudentsPlaced ||
			existing.Placements.TotalCompaniesVisited != newStats.Placements.TotalCompaniesVisited ||
			len(existing.TopRecruiters) != len(newStats.TopRecruiters) ||
			len(existing.PlacementComparison) != len(newStats.PlacementComparison) {
			return true
		}
	case "fees":
		if existing.Fees.UG.PerYear != newStats.Fees.UG.PerYear ||
			existing.Fees.PG.PerYear != newStats.Fees.PG.PerYear ||
			existing.Fees.HostelPerYear != newStats.Fees.HostelPerYear ||
			existing.FeesNote != newStats.FeesNote ||
			len(existing.ScholarshipsDetail) != len(newStats.ScholarshipsDetail) ||
			len(existing.FeesByYear) != len(newStats.FeesByYear) {
			return true
		}
	case "infrastructure":
		if len(existing.Infrastructure) != len(newStats.Infrastructure) ||
			existing.HostelDetails.Available != newStats.HostelDetails.Available ||
			fmt.Sprintf("%v", existing.HostelDetails.TotalCapacity) != fmt.Sprintf("%v", newStats.HostelDetails.TotalCapacity) ||
			existing.LibraryDetails.TotalBooks != newStats.LibraryDetails.TotalBooks ||
			existing.TransportDetails.Buses != newStats.TransportDetails.Buses {
			return true
		}
	}
	return false
}

// ValidateAndUpdateSectionWithGemini fetches the given section from Gemini,
// validates its structure, and if valid AND changed calls sectionUpdate so the
// caller can persist the raw Gemini map to MongoDB + Redis.
func ValidateAndUpdateSectionWithGemini(
	officialName string,
	searchName string,
	section string,
	sectionUpdate func(official, search, section string, data map[string]interface{}),
) {
	log.Printf(" [Gemini %s] Starting background validation for: %s", section, officialName)

	geminiData, err := FetchSectionFromGemini(section, officialName)
	if err != nil {
		log.Printf(" [Gemini %s] Fetch failed: %v — keeping Groq data", section, err)
		return
	}

	if !IsStructureValid(section, geminiData) {
		log.Printf(" [Gemini %s] Invalid structure — keeping Groq data", section)
		return
	}

	// Check if data actually changed compared to existing Groq data
	existing, found := GetFromCache(officialName)
	if found && !HasSectionChanged(existing, section, geminiData) {
		log.Printf("ℹ️ [Gemini %s] No meaningful changes — skipping DB write for %s", section, officialName)
		return
	}

	log.Printf(" [Gemini %s] Changes detected — replacing section + storing extra fields", section)

	// Delegate to caller: caller handles mutex, DB write, Redis write, WebSocket broadcast
	sectionUpdate(officialName, searchName, section, geminiData)
}

// ValidateAllSectionsWithGemini validates all sections in parallel, then
// calls sectionUpdate for each section that Gemini returns successfully.
func ValidateAllSectionsWithGemini(
	stats *models.CollegeStats,
	searchName string,
	sectionUpdate func(official, search, section string, data map[string]interface{}),
) {
	log.Printf(" Starting Gemini background validation for: %s", stats.CollegeName)

	sections := []string{"general", "programs", "placements", "fees", "infrastructure"}
	for _, sec := range sections {
		sec := sec // capture
		go ValidateAndUpdateSectionWithGemini(stats.CollegeName, searchName, sec, sectionUpdate)
	}

	log.Printf(" Gemini validation goroutines launched for: %s", stats.CollegeName)
}

// FixIncompleteJSON uses a stack-based approach to close open braces/brackets
// in the correct reverse-nesting order. Also handles the case where the text
// was truncated mid-string by backtracking to the last safe JSON boundary.
func FixIncompleteJSON(text string) string {
	var stack []byte
	inString := false
	escaped := false
	lastSafePos := 0 // last position that was at depth>0 and not inside a string, after a value

	for i := 0; i < len(text); i++ {
		ch := text[i]

		if escaped {
			escaped = false
			continue
		}
		if ch == '\\' && inString {
			escaped = true
			continue
		}
		if ch == '"' {
			if inString {
				// closing a string — mark safe position after this char
				inString = false
				lastSafePos = i + 1
			} else {
				inString = true
			}
			continue
		}
		if inString {
			continue
		}

		switch ch {
		case '{':
			stack = append(stack, '}')
			lastSafePos = i + 1
		case '[':
			stack = append(stack, ']')
			lastSafePos = i + 1
		case '}', ']':
			if len(stack) > 0 {
				stack = stack[:len(stack)-1]
			}
			lastSafePos = i + 1
		case ',', ':', ' ', '\t', '\n', '\r':
			// whitespace/delimiters outside strings are safe
		}

		// Track safe positions after numbers/booleans (non-string values)
		if ch >= '0' && ch <= '9' || ch == '.' || ch == '-' {
			// within a number — update safe after this char if next char closes it
			// (handled by tracking after the loop exits normally)
		}
	}

	// If we ended inside an open string, backtrack to lastSafePos
	// to discard the partial/truncated string value
	if inString && lastSafePos > 0 && lastSafePos < len(text) {
		log.Printf(" FixIncompleteJSON: truncated inside string at pos %d, backtracking to pos %d", len(text), lastSafePos)
		text = text[:lastSafePos]
		// Re-scan the truncated text to get the correct stack
		stack = stack[:0]
		inStr2 := false
		esc2 := false
		for i := 0; i < len(text); i++ {
			ch := text[i]
			if esc2 {
				esc2 = false
				continue
			}
			if ch == '\\' && inStr2 {
				esc2 = true
				continue
			}
			if ch == '"' {
				inStr2 = !inStr2
				continue
			}
			if inStr2 {
				continue
			}
			switch ch {
			case '{':
				stack = append(stack, '}')
			case '[':
				stack = append(stack, ']')
			case '}', ']':
				if len(stack) > 0 {
					stack = stack[:len(stack)-1]
				}
			}
		}
	}

	if len(stack) == 0 {
		return text
	}

	// Build closing sequence in reverse stack order
	closing := make([]byte, len(stack))
	for i, ch := range stack {
		closing[len(stack)-1-i] = ch
	}

	// Remove trailing comma/colon before the first closer we're about to add
	trimmed := strings.TrimRight(text, " \t\n\r")
	if len(trimmed) > 0 {
		last := trimmed[len(trimmed)-1]
		if last == ',' || last == ':' {
			text = trimmed[:len(trimmed)-1]
		}
	}

	text = text + string(closing)
	log.Printf(" Fixed incomplete JSON — appended closers: %s", string(closing))

	// Clean up any remaining trailing commas before } or ]
	reComma := regexp.MustCompile(`,( *[}\]])`)
	text = reComma.ReplaceAllString(text, "$1")

	return text
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
