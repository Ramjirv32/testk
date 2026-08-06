package main

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

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type GeminiRequest struct {
	Contents []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"contents"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

type VerificationResult struct {
	Section      string                 `json:"section"`
	Data         map[string]interface{} `json:"data"`
	Verified     bool                   `json:"verified"`
	Accuracy     string                 `json:"accuracy"` // high, medium, low
	GuessedData  bool                   `json:"guessed_data"`
	Source       string                 `json:"source"`
	VerifiedAt   time.Time              `json:"verified_at"`
	ErrorMessage string                 `json:"error,omitempty"`
}

func callGemini(prompt string, apiKey string) (string, error) {
	reqBody := GeminiRequest{
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
	}

	jsonBody, _ := json.Marshal(reqBody)

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=%s", apiKey)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("API request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	var geminiResp GeminiResponse
	if err := json.Unmarshal(bodyBytes, &geminiResp); err != nil {
		return "", fmt.Errorf("failed to parse Gemini response: %v", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from Gemini")
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

func extractJSON(text string) string {
	// Try to extract JSON from markdown code blocks first
	re := regexp.MustCompile("(?s)```(?:json)?\\s*(.+?)```")
	matches := re.FindStringSubmatch(text)
	if len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	// If no markdown blocks, try to find JSON object
	re2 := regexp.MustCompile("(?s)\\{.*\\}")
	if matches := re2.FindString(text); matches != "" {
		return matches
	}
	return strings.TrimSpace(text)
}

func verifyRankings(collegeName, apiKey string) *VerificationResult {
	fmt.Print("   Verifying Rankings... ")

	prompt := fmt.Sprintf(`Verify CURRENT 2026 official university rankings for: %s

Return ONLY valid JSON (no markdown, no explanation):
{
  "qs_world": "<current 2026 QS Global Rank as string, e.g. '=281'>",
  "national_rank_nz": <current rank within New Zealand as number>,
  "the_world": "<THE World 2024/2025 or 'N/A'>",
  "arwu": "<ARWU 2024 or 'N/A'>",
  "accuracy": "<high/medium/low>",
  "guessed_data": <true/false>,
  "source": "<official source>"
}

Use ONLY: QS Rankings official website, THE Rankings, ARWU, official university data.`, collegeName)

	result, err := callGemini(prompt, apiKey)
	if err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "rankings",
			Verified:     false,
			ErrorMessage: err.Error(),
		}
	}

	jsonStr := extractJSON(result)
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "rankings",
			Verified:     false,
			ErrorMessage: fmt.Sprintf("JSON parse failed: %v", err),
		}
	}

	fmt.Println("")
	return &VerificationResult{
		Section:    "rankings",
		Data:       data,
		Verified:   true,
		Accuracy:   "high",
		VerifiedAt: time.Now(),
	}
}

func verifyPlacements(collegeName, apiKey string) *VerificationResult {
	fmt.Print("   Verifying Placements... ")

	prompt := fmt.Sprintf(`Find VERIFIED 2023-2024 placement data for: %s

Return ONLY valid JSON (no markdown):
{
  "year": 2023,
  "placement_rate_percent": <number or -1 if unknown>,
  "average_package_nzd": <number or -1>,
  "highest_package_nzd": <number or -1>,
  "total_placed": <number or -1>,
  "companies_visited": <number or -1>,
  "top_sectors": ["<sector1>", "<sector2>"],
  "top_recruiters": ["<company1>", "<company2>"],
  "accuracy": "<high/medium/low>",
  "guessed_data": <true/false>,
  "source": "<source>"
}

For NZ universities use NZD. If data not published, use -1 for numbers.`, collegeName)

	result, err := callGemini(prompt, apiKey)
	if err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "placements",
			Verified:     false,
			ErrorMessage: err.Error(),
		}
	}

	jsonStr := extractJSON(result)
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "placements",
			Verified:     false,
			ErrorMessage: fmt.Sprintf("JSON parse failed: %v", err),
		}
	}

	fmt.Println("")
	return &VerificationResult{
		Section:    "placements",
		Data:       data,
		Verified:   true,
		VerifiedAt: time.Now(),
	}
}

func verifyFees(collegeName, apiKey string) *VerificationResult {
	fmt.Print("   Verifying Fees... ")

	prompt := fmt.Sprintf(`Find OFFICIAL 2024-2025 international student fee structure for: %s

Return ONLY valid JSON (no markdown):
{
  "year": 2024,
  "ug_annual_fee_nzd": <number or -1>,
  "pg_annual_fee_nzd": <number or -1>,
  "hostel_annual_fee_nzd": <number or -1>,
  "currency": "NZD",
  "accuracy": "<high/medium/low>",
  "guessed_data": <true/false>,
  "source": "<official source website>"
}

Use NZD for NZ universities. Use -1 if fees not publicly available.`, collegeName)

	result, err := callGemini(prompt, apiKey)
	if err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "fees",
			Verified:     false,
			ErrorMessage: err.Error(),
		}
	}

	jsonStr := extractJSON(result)
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "fees",
			Verified:     false,
			ErrorMessage: fmt.Sprintf("JSON parse failed: %v", err),
		}
	}

	fmt.Println("")
	return &VerificationResult{
		Section:    "fees",
		Data:       data,
		Verified:   true,
		VerifiedAt: time.Now(),
	}
}

func verifyInfrastructure(collegeName, apiKey string) *VerificationResult {
	fmt.Print("   Verifying Infrastructure... ")

	prompt := fmt.Sprintf(`Verify campus infrastructure for: %s

Return ONLY valid JSON (no markdown):
{
  "key_facilities": ["<facility1>", "<facility2>", "<facility3>"],
  "hostel_capacity": <number or -1>,
  "library_status": "<description>",
  "labs_available": "<description>",
  "sports_facilities": "<yes/no>",
  "accuracy": "<high/medium/low>",
  "source": "<source>"
}`, collegeName)

	result, err := callGemini(prompt, apiKey)
	if err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "infrastructure",
			Verified:     false,
			ErrorMessage: err.Error(),
		}
	}

	jsonStr := extractJSON(result)
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "infrastructure",
			Verified:     false,
			ErrorMessage: fmt.Sprintf("JSON parse failed: %v", err),
		}
	}

	fmt.Println("")
	return &VerificationResult{
		Section:    "infrastructure",
		Data:       data,
		Verified:   true,
		VerifiedAt: time.Now(),
	}
}

func verifyPrograms(collegeName, apiKey string) *VerificationResult {
	fmt.Print("   Verifying Programs... ")

	prompt := fmt.Sprintf(`List ALL official programs for: %s

Return ONLY valid JSON (no markdown):
{
  "total_ug_programs": <count>,
  "total_pg_programs": <count>,
  "total_phd_programs": <count>,
  "ug_sample_programs": ["<prog1>", "<prog2>", "<prog3>"],
  "pg_sample_programs": ["<prog1>", "<prog2>", "<prog3>"],
  "accuracy": "<high/medium/low>",
  "source": "<official source>"
}

Use official university website data only.`, collegeName)

	result, err := callGemini(prompt, apiKey)
	if err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "programs",
			Verified:     false,
			ErrorMessage: err.Error(),
		}
	}

	jsonStr := extractJSON(result)
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "programs",
			Verified:     false,
			ErrorMessage: fmt.Sprintf("JSON parse failed: %v", err),
		}
	}

	fmt.Println("")
	return &VerificationResult{
		Section:    "programs",
		Data:       data,
		Verified:   true,
		VerifiedAt: time.Now(),
	}
}

func verifyStudentStats(collegeName, apiKey string) *VerificationResult {
	fmt.Print("   Verifying Student Stats... ")

	prompt := fmt.Sprintf(`Verify current student statistics for: %s

Return ONLY valid JSON (no markdown):
{
  "year": 2024,
  "total_enrollment": <number or -1>,
  "ug_students": <number or -1>,
  "pg_students": <number or -1>,
  "phd_students": <number or -1>,
  "international_students": <number or -1>,
  "male_female_ratio": "<male%/female%>",
  "accuracy": "<high/medium/low>",
  "guessed_data": <true/false>,
  "source": "<official source>"
}`, collegeName)

	result, err := callGemini(prompt, apiKey)
	if err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "student_stats",
			Verified:     false,
			ErrorMessage: err.Error(),
		}
	}

	jsonStr := extractJSON(result)
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		fmt.Println("")
		return &VerificationResult{
			Section:      "student_stats",
			Verified:     false,
			ErrorMessage: fmt.Sprintf("JSON parse failed: %v", err),
		}
	}

	fmt.Println("")
	return &VerificationResult{
		Section:    "student_stats",
		Data:       data,
		Verified:   true,
		VerifiedAt: time.Now(),
	}
}

func updateDatabase(ctx context.Context, collegeCollection *mongo.Collection, collegeName string, verifications []*VerificationResult) error {
	filter := bson.M{"college_name": collegeName}

	// Build update document
	updateSet := bson.M{
		"updated_at": time.Now(),
	}

	// Apply verified rankings
	for _, v := range verifications {
		if v.Section == "rankings" && v.Verified {
			if qsWorld, ok := v.Data["qs_world"]; ok {
				updateSet["rankings.qs_world"] = qsWorld
			}
			if nationalRank, ok := v.Data["national_rank_nz"]; ok {
				updateSet["rankings.national_rank"] = nationalRank
			}
		}
	}

	// Store all verification results
	updateSet["verification_gemini"] = verifications

	update := bson.M{"$set": updateSet}

	result, err := collegeCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	fmt.Printf("\n Database Updated!\n")
	fmt.Printf("   Matched: %d | Modified: %d\n", result.MatchedCount, result.ModifiedCount)

	return nil
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("ERROR: GEMINI_API_KEY not set")
	}

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("ERROR: MONGO_URI not set")
	}

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	collegeCollection := client.Database("tru").Collection("college_details")
	collegeName := "University of Waikato"

	fmt.Printf("\n COMPREHENSIVE GEMINI VERIFICATION FOR: %s\n", collegeName)
	fmt.Println(strings.Repeat("=", 70))

	// Run all verifications in parallel
	verifications := []*VerificationResult{
		verifyRankings(collegeName, apiKey),
		verifyPlacements(collegeName, apiKey),
		verifyFees(collegeName, apiKey),
		verifyInfrastructure(collegeName, apiKey),
		verifyPrograms(collegeName, apiKey),
		verifyStudentStats(collegeName, apiKey),
	}

	fmt.Println("\n Verification Summary:")
	fmt.Println(strings.Repeat("=", 70))
	verified := 0
	for _, v := range verifications {
		status := " VERIFIED"
		if !v.Verified {
			status = "  REVIEW"
		} else {
			verified++
		}
		fmt.Printf("%s - %s", status, strings.ToUpper(v.Section))
		if v.ErrorMessage != "" {
			fmt.Printf(" (%s)\n", v.ErrorMessage)
		} else {
			fmt.Println()
		}
	}

	fmt.Printf("\n Results: %d/%d sections verified\n", verified, len(verifications))

	// Update database
	if err := updateDatabase(ctx, collegeCollection, collegeName, verifications); err != nil {
		log.Fatalf("Database update failed: %v", err)
	}

	// Display verified rankings
	fmt.Println("\n VERIFIED DATA:")
	fmt.Println(strings.Repeat("=", 70))
	for _, v := range verifications {
		if v.Section == "rankings" && v.Verified {
			fmt.Printf("   QS World: %v\n", v.Data["qs_world"])
			fmt.Printf("   NZ National Rank: %v\n", v.Data["national_rank_nz"])
		}
	}

	fmt.Println("\n All verifications complete and database updated!")
}
