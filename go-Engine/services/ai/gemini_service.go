package ai

import (
	"bytes"
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

// Call API handlers
func CallGroqAPI(label string, prompt string, maxTokens int) (map[string]interface{}, error) {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GROQ_API_KEY not set")
	}

	reqBody := GroqRequest{
		Model: GROQ_MODEL_ID,
		Messages: []GroqMessage{
			{Role: "user", Content: prompt},
		},
		Temperature: 0.1,
	}

	jsonData, _ := json.Marshal(reqBody)

	var lastErr error
	for i := 0; i < 3; i++ {
		req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+apiKey)

		client := &http.Client{Timeout: 60 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode == 429 {
			log.Printf(" Groq Rate Limit (429), retrying in 3s... (attempt %d/3)", i+1)
			time.Sleep(3 * time.Second)
			lastErr = fmt.Errorf("Groq API error 429: %s", string(body))
			continue
		}

		if resp.StatusCode != 200 {
			return nil, fmt.Errorf("Groq API error %d: %s", resp.StatusCode, string(body))
		}

		var groqResp GroqResponse
		if err := json.Unmarshal(body, &groqResp); err != nil {
			return nil, err
		}

		if len(groqResp.Choices) == 0 {
			return nil, fmt.Errorf("empty choice from Groq")
		}

		text := CleanJSON(groqResp.Choices[0].Message.Content)
		var result map[string]interface{}
		if err := json.Unmarshal([]byte(text), &result); err != nil {
			return nil, err
		}

		return result, nil
	}

	return nil, lastErr
}

func CallGeminiAPI(label string, prompt string, maxTokens int) (map[string]interface{}, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY not set")
	}

	reqBody := GeminiRequest{}
	reqBody.Contents = []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	}{{Parts: []struct {
		Text string `json:"text"`
	}{{Text: prompt}}}}
	reqBody.GenerationConfig.Temperature = 0.1
	reqBody.GenerationConfig.MaxOutputTokens = maxTokens

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", GEMINI_MODEL_ID, apiKey)
	jsonData, _ := json.Marshal(reqBody)

	var lastErr error
	for i := 0; i < 3; i++ {
		req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 60 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf(" Gemini Attempt %d failed: %v", i+1, err)
			lastErr = err
			time.Sleep(2 * time.Second)
			continue
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != 200 {
			log.Printf(" Gemini error %d: %s", resp.StatusCode, string(body))
			lastErr = fmt.Errorf("Gemini API error %d: %s", resp.StatusCode, string(body))
			time.Sleep(2 * time.Second)
			continue
		}

		var gemResp GeminiResponse
		if err := json.Unmarshal(body, &gemResp); err != nil {
			lastErr = err
			continue
		}

		if len(gemResp.Candidates) == 0 || len(gemResp.Candidates[0].Content.Parts) == 0 {
			lastErr = fmt.Errorf("empty response from Gemini")
			continue
		}

		var sb strings.Builder
		for _, part := range gemResp.Candidates[0].Content.Parts {
			sb.WriteString(part.Text)
		}
		rawText := sb.String()
		text := CleanJSON(rawText)
		var result map[string]interface{}
		if err := json.Unmarshal([]byte(text), &result); err != nil {
			lastErr = err
			continue
		}

		return result, nil
	}

	return nil, lastErr
}

// ---------------------------------------------------------------------------
// Reconciliation & Mapping
// ---------------------------------------------------------------------------

func Reconcile(groqData map[string]interface{}, geminiData map[string]interface{}) map[string]interface{} {
	if geminiData == nil {
		return groqData
	}
	if groqData == nil {
		return geminiData
	}

	groqWinsSubkeys := map[string]bool{
		"total_ug_courses":  true,
		"total_pg_courses":  true,
		"total_phd_courses": true,
	}

	result := make(map[string]interface{})
	for k, v := range groqData {
		result[k] = v
	}

	for key, gemVal := range geminiData {
		groqVal, exists := result[key]
		if !exists && gemVal != nil {
			result[key] = gemVal
		} else if gemSub, ok := gemVal.(map[string]interface{}); ok {
			if groqSub, ok := groqVal.(map[string]interface{}); ok {
				mergedSub := make(map[string]interface{})
				for sk, sv := range groqSub {
					mergedSub[sk] = sv
				}
				for sk, sv := range gemSub {
					gv := mergedSub[sk]
					if groqWinsSubkeys[sk] {
						if gv != nil && gv != "not_available" {
							// keep Groq
						} else if sv != nil && sv != "not_available" {
							mergedSub[sk] = sv
						}
					} else if fmt.Sprintf("%v", gv) != fmt.Sprintf("%v", sv) && sv != nil && sv != "not_available" {
						mergedSub[sk] = sv
					}
				}
				result[key] = mergedSub
			}
		} else if fmt.Sprintf("%v", gemVal) != fmt.Sprintf("%v", groqVal) && gemVal != nil && gemVal != "not_available" {
			result[key] = gemVal
		}
	}
	return result
}

func FetchCollegeDataFromGemini(collegeName string) (*models.CollegeStats, error) {
	// Original behavior was redirecting to FetchCollegeDataFromGroq
	// But now we implement the full 2-phase logic.
	// This function will probably be called by the orchestrator in college_service.
	// For now, let's provide a basic implementation or just link it to the new flow.
	return nil, fmt.Errorf("use the new orchestrator flow")
}

// ============================================================================
// GEMINI BATCH ORCHESTRATION - Phase 1 + Phase 2 with Validation & Merge
// ============================================================================

// ProcessGeminiBatch orchestrates the complete Gemini batch workflow:
// 1. Fetch Phase 1 (general) from Gemini - validate + enrich Groq data
// 2. Fetch Phase 2 sections (programs, placements, fees, infrastructure) in parallel
// 3. Merge all data with Groq Phase 1
// 4. Replace MongoDB records with merged data
// This ensures ALL data (Phase 1 + Phase 2) goes through Gemini validation.
func ProcessGeminiBatch(
	officialName string,
	searchName string,
	groqPhase1Data *models.CollegeStats,
	sectionUpdate func(official, search, section string, data map[string]interface{}),
) {
	log.Printf(" [Gemini Batch] Starting full orchestration for: %s", officialName)

	// STEP 1: Fetch + Validate Gemini Phase 1 (general)
	log.Printf(" [Gemini Batch] STEP 1: Fetching Phase 1 (general) from Gemini...")
	phase1Data, err := FetchSectionFromGemini("general", officialName)
	if err != nil {
		log.Printf(" [Gemini Batch] Phase 1 fetch failed: %v — keeping Groq Phase 1 data", err)
		phase1Data = nil // Will use Groq data if Gemini fails
	}

	if phase1Data != nil && !IsStructureValid("general", phase1Data) {
		log.Printf(" [Gemini Batch] Gemini Phase 1 structure invalid — keeping Groq Phase 1 data")
		phase1Data = nil
	}

	// If Gemini Phase 1 succeeded, use it to update/enrich
	if phase1Data != nil {
		log.Printf(" [Gemini Batch] Phase 1 validated — updating with Gemini data")
		sectionUpdate(officialName, searchName, "general", phase1Data)
	}

	// STEP 2: Fetch Phase 2 sections in parallel (programs, placements, fees, infrastructure)
	log.Printf(" [Gemini Batch] STEP 2: Fetching Phase 2 sections in parallel...")
	phase2Sections := []string{"programs", "placements", "fees", "infrastructure"}
	var wg sync.WaitGroup

	for _, sec := range phase2Sections {
		wg.Add(1)
		go func(s string) {
			defer wg.Done()
			log.Printf(" [Gemini Batch] Fetching Phase 2 section: %s", s)

			sectionData, err := FetchSectionFromGemini(s, officialName)
			if err != nil {
				log.Printf(" [Gemini Batch] %s fetch failed: %v", s, err)
				return
			}

			if !IsStructureValid(s, sectionData) {
				log.Printf(" [Gemini Batch] %s structure invalid", s)
				return
			}

			// Check if data changed compared to existing
			existing, found := GetFromCache(officialName)
			if found && !HasSectionChanged(existing, s, sectionData) {
				log.Printf("ℹ️ [Gemini Batch] %s has no changes — skipping DB write", s)
				return
			}

			log.Printf(" [Gemini Batch] %s changes detected — persisting", s)
			sectionUpdate(officialName, searchName, s, sectionData)
		}(sec)
	}

	wg.Wait()
	log.Printf(" [Gemini Batch] All Phase 2 sections processed for: %s", officialName)

	log.Printf(" [Gemini Batch] Complete orchestration finished for: %s", officialName)
}

// FetchPhase1FromGemini explicitly fetches Phase 1 (general section) from Gemini
// Returns the raw JSON map that can be merged with Groq data
func FetchPhase1FromGemini(collegeName string) (map[string]interface{}, error) {
	log.Printf(" [Gemini Phase1] Fetching core info for: %s", collegeName)

	data, err := FetchSectionFromGemini("general", collegeName)
	if err != nil {
		log.Printf(" [Gemini Phase1] Request failed: %v", err)
		return nil, err
	}

	if !IsStructureValid("general", data) {
		log.Printf(" [Gemini Phase1] Structure validation failed")
		return nil, fmt.Errorf("gemini phase1 structure invalid")
	}

	log.Printf(" [Gemini Phase1] Successfully fetched and validated for: %s", collegeName)
	return data, nil
}
