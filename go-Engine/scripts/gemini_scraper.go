package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
)

// ---------------------------------------------------------------------------
// Configuration & Constants
// ---------------------------------------------------------------------------

const (
	GEMINI_MODEL = "gemini-3-flash-preview"
	GROQ_MODEL   = "meta-llama/llama-4-scout-17b-16e-instruct"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func cleanJSON(text string) string {
	text = strings.TrimSpace(text)
	// Remove markdown fences
	re := regexp.MustCompile("(?is)^```(?:json)?\\s*(.*?)\\s*```$")
	match := re.FindStringSubmatch(text)
	if len(match) > 1 {
		text = match[1]
	}

	// Extract everything between first { and last }
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start != -1 && end != -1 && end > start {
		text = text[start : end+1]
	}

	// Repair common JSON quirks: trailing commas
	reComma := regexp.MustCompile(`,(\s*[}\]])`)
	text = reComma.ReplaceAllString(text, "$1")

	// Remove control characters
	reCtrl := regexp.MustCompile(`[\x00-\x08\x0b\x0c\x0e-\x1f]`)
	text = reCtrl.ReplaceAllString(text, " ")

	return text
}

func callGroq(label string, prompt string, maxTokens int) (string, map[string]interface{}, float64) {
	t0 := time.Now()
	apiKey := os.Getenv("GROQ_API_KEY")

	reqBody := GroqRequest{
		Model: GROQ_MODEL,
		Messages: []GroqMessage{
			{Role: "user", Content: prompt},
		},
		Temperature: 0.1,
		MaxTokens:   maxTokens,
	}

	for attempt := 1; attempt <= 3; attempt++ {
		jsonData, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+apiKey)

		client := &http.Client{Timeout: 60 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			if attempt < 3 {
				time.Sleep(500 * time.Millisecond)
				continue
			}
			return label, nil, time.Since(t0).Seconds()
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != 200 {
			if attempt < 3 {
				time.Sleep(500 * time.Millisecond)
				continue
			}
			return label, nil, time.Since(t0).Seconds()
		}

		var groqResp GroqResponse
		if err := json.Unmarshal(body, &groqResp); err != nil {
			if attempt < 3 {
				time.Sleep(500 * time.Millisecond)
				continue
			}
			return label, nil, time.Since(t0).Seconds()
		}

		if len(groqResp.Choices) == 0 {
			return label, nil, time.Since(t0).Seconds()
		}

		text := cleanJSON(groqResp.Choices[0].Message.Content)
		var result map[string]interface{}
		if err := json.Unmarshal([]byte(text), &result); err != nil {
			if attempt < 3 {
				time.Sleep(500 * time.Millisecond)
				continue
			}
			return label, nil, time.Since(t0).Seconds()
		}

		elapsed := time.Since(t0).Seconds()
		fmt.Printf("   [groq:%s] done in %.2fs\n", label, elapsed)
		return label, result, elapsed
	}

	return label, nil, time.Since(t0).Seconds()
}

func callGemini(label string, prompt string, maxTokens int) (string, map[string]interface{}, float64) {
	t0 := time.Now()
	apiKey := os.Getenv("GEMINI_API_KEY")

	reqBody := GeminiRequest{}
	reqBody.Contents = []struct {
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
	}
	reqBody.GenerationConfig.Temperature = 0.1
	reqBody.GenerationConfig.MaxOutputTokens = maxTokens

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", GEMINI_MODEL, apiKey)

	for attempt := 1; attempt <= 3; attempt++ {
		jsonData, _ := json.Marshal(reqBody)
		req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 60 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			if attempt < 3 {
				time.Sleep(1 * time.Second)
				continue
			}
			return label, nil, time.Since(t0).Seconds()
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != 200 {
			fmt.Printf("   [%s] Gemini Error %d: %s\n", label, resp.StatusCode, string(body))
			if attempt < 3 {
				time.Sleep(1 * time.Second)
				continue
			}
			return label, nil, time.Since(t0).Seconds()
		}

		var gemResp GeminiResponse
		if err := json.Unmarshal(body, &gemResp); err != nil {
			if attempt < 3 {
				time.Sleep(1 * time.Second)
				continue
			}
			return label, nil, time.Since(t0).Seconds()
		}

		if len(gemResp.Candidates) == 0 || len(gemResp.Candidates[0].Content.Parts) == 0 {
			return label, nil, time.Since(t0).Seconds()
		}

		text := cleanJSON(gemResp.Candidates[0].Content.Parts[0].Text)
		var result map[string]interface{}
		if err := json.Unmarshal([]byte(text), &result); err != nil {
			fmt.Printf("   [%s] JSON Decode Error: %v\n", label, err)
			if attempt < 3 {
				time.Sleep(1 * time.Second)
				continue
			}
			return label, nil, time.Since(t0).Seconds()
		}

		elapsed := time.Since(t0).Seconds()
		fmt.Printf("   [%s] done in %.2fs\n", label, elapsed)
		return label, result, elapsed
	}

	return label, nil, time.Since(t0).Seconds()
}

func reconcile(groqData map[string]interface{}, geminiData map[string]interface{}) (map[string]interface{}, []string) {
	if geminiData == nil {
		return groqData, nil
	}
	if groqData == nil {
		return geminiData, nil
	}

	groqWinsSubkeys := map[string]bool{
		"total_ug_courses":  true,
		"total_pg_courses":  true,
		"total_phd_courses": true,
	}

	changes := []string{}
	result := make(map[string]interface{})
	for k, v := range groqData {
		result[k] = v
	}

	for key, gemVal := range geminiData {
		groqVal, exists := result[key]
		if !exists && gemVal != nil {
			result[key] = gemVal
			changes = append(changes, fmt.Sprintf("  + %s: added from Gemini", key))
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
						changes = append(changes, fmt.Sprintf("  ~ %s.%s: %v → %v", key, sk, gv, sv))
					}
				}
				result[key] = mergedSub
			}
		} else if fmt.Sprintf("%v", gemVal) != fmt.Sprintf("%v", groqVal) && gemVal != nil && gemVal != "not_available" {
			result[key] = gemVal
			changes = append(changes, fmt.Sprintf("  ~ %s: %v → %v", key, groqVal, gemVal))
		}
	}

	return result, changes
}

// ---------------------------------------------------------------------------
// Main Logic
// ---------------------------------------------------------------------------

func extractCollege(collegeName string) map[string]interface{} {
	timings := make(map[string]float64)
	allResults := make(map[string]interface{})

	fmt.Printf("\n [%s] Phase 1 — Groq + Gemini in parallel…\n", collegeName)
	p1Prompt := strings.ReplaceAll(PHASE1_PROMPT, "{name}", collegeName)

	var groqResult, geminiResult map[string]interface{}
	var groqElapsed, geminiElapsed float64
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		_, groqResult, groqElapsed = callGroq("phase1_groq", p1Prompt, 4096)
	}()

	go func() {
		defer wg.Done()
		_, geminiResult, geminiElapsed = callGemini("phase1_gemini", p1Prompt, 4096)
	}()

	wg.Wait()
	timings["phase1_groq"] = groqElapsed
	timings["phase1_gemini"] = geminiElapsed

	var p1Result map[string]interface{}
	if groqResult != nil && geminiResult != nil {
		var changes []string
		p1Result, changes = reconcile(groqResult, geminiResult)
		if len(changes) > 0 {
			fmt.Printf("\n Reconciled %d field(s) — Gemini wins:\n", len(changes))
			for _, c := range changes {
				fmt.Println(c)
			}
		} else {
			fmt.Println("\n Groq ≡ Gemini for Phase 1 — no changes needed")
		}
	} else if groqResult != nil {
		p1Result = groqResult
		fmt.Println("   Gemini Phase 1 failed — using Groq-only result")
	} else if geminiResult != nil {
		p1Result = geminiResult
		fmt.Println("   Groq Phase 1 failed — using Gemini-only result")
	} else {
		fmt.Println("   Both Phase 1 sources failed")
	}

	p1Wall := groqElapsed
	if geminiElapsed > p1Wall {
		p1Wall = geminiElapsed
	}
	allResults["phase1_overview"] = p1Result
	timings["phase1_wall"] = p1Wall

	fmt.Printf("\n[] Phase 1 complete in %.2fs (Groq=%.2fs Gemini=%.2fs)\n", p1Wall, groqElapsed, geminiElapsed)

	// Phase 2
	fmt.Printf(" Phase 2 — %d sections × 2 models in parallel…\n\n", len(PHASE2_SECTIONS))
	wallP2Start := time.Now()

	sectionTokens := map[string]int{
		"fees_infra": 8000,
		"placements": 8000,
		"programs":   8000,
	}

	groqP2 := make(map[string]map[string]interface{})
	geminiP2 := make(map[string]map[string]interface{})
	var mu sync.Mutex

	wg.Add(len(PHASE2_SECTIONS) * 2)

	for sec, prompt := range PHASE2_SECTIONS {
		s, p := sec, prompt
		go func() {
			defer wg.Done()
			tokens := 4096
			if t, ok := sectionTokens[s]; ok {
				tokens = t
			}
			_, res, elap := callGroq("p2_"+s, strings.ReplaceAll(p, "{name}", collegeName), tokens)
			mu.Lock()
			groqP2[s] = res
			timings["groq2:"+s] = elap
			mu.Unlock()
		}()
		go func() {
			defer wg.Done()
			tokens := 4096
			if t, ok := sectionTokens[s]; ok {
				tokens = t
			}
			_, res, elap := callGemini("p2_"+s, strings.ReplaceAll(p, "{name}", collegeName), tokens)
			mu.Lock()
			geminiP2[s] = res
			timings["gemini2:"+s] = elap
			mu.Unlock()
		}()
	}

	wg.Wait()

	for sec := range PHASE2_SECTIONS {
		gRes := groqP2[sec]
		mRes := geminiP2[sec]
		if gRes != nil && mRes != nil {
			rec, changes := reconcile(gRes, mRes)
			if len(changes) > 0 {
				fmt.Printf("   [%s] reconciled %d field(s) — Gemini wins\n", sec, len(changes))
			}
			allResults[sec] = rec
		} else if gRes != nil {
			fmt.Printf("   [%s] Gemini failed — using Groq only\n", sec)
			allResults[sec] = gRes
		} else if mRes != nil {
			fmt.Printf("   [%s] Groq failed — using Gemini only\n", sec)
			allResults[sec] = mRes
		} else {
			allResults[sec] = nil
		}

		maxElap := timings["groq2:"+sec]
		if timings["gemini2:"+sec] > maxElap {
			maxElap = timings["gemini2:"+sec]
		}
		timings[sec] = maxElap
	}

	wallP2 := time.Since(wallP2Start).Seconds()
	totalWall := p1Wall + wallP2

	// Final Merge
	merged := make(map[string]interface{})
	if p1Result != nil {
		for k, v := range p1Result {
			merged[k] = v
		}
	}
	for sec, res := range allResults {
		if sec == "phase1_overview" {
			continue
		}
		if resMap, ok := res.(map[string]interface{}); ok {
			for k, v := range resMap {
				merged[k] = v
			}
		}
	}

	merged["_meta"] = map[string]interface{}{
		"total_wall": totalWall,
		"p1_wall":    p1Wall,
		"p2_wall":    wallP2,
		"timings":    timings,
	}

	fmt.Printf("\n" + strings.Repeat("", 50) + "\n")
	fmt.Printf(" Total wall-clock : %.2fs\n", totalWall)
	fmt.Printf("\n%-28s %7s  %7s  %7s  Status\n", "Section", "Groq", "Gemini", "Wall")
	fmt.Println(strings.Repeat("", 62))

	rowSecs := []string{"phase1_overview"}
	for k := range PHASE2_SECTIONS {
		rowSecs = append(rowSecs, k)
	}

	for _, sec := range rowSecs {
		var tg, tm, tw float64
		if sec == "phase1_overview" {
			tg = timings["phase1_groq"]
			tm = timings["phase1_gemini"]
			tw = timings["phase1_wall"]
		} else {
			tg = timings["groq2:"+sec]
			tm = timings["gemini2:"+sec]
			tw = timings[sec]
		}
		ok := ""
		if allResults[sec] != nil {
			ok = ""
		}
		fmt.Printf("  %-26s %6.2fs  %7.2fs  %6.2fs  %s\n", sec, tg, tm, tw, ok)
	}

	return merged
}

func main() {
	godotenv.Load()

	collegeName := "Bifröst University"
	if len(os.Args) > 1 {
		collegeName = os.Args[1]
	}

	data := extractCollege(collegeName)

	safe := func(s string) string {
		s = strings.ToLower(s)
		s = strings.ReplaceAll(s, " ", "_")
		s = strings.ReplaceAll(s, "/", "_")
		s = strings.ReplaceAll(s, ",", "")
		return s
	}

	outPath := fmt.Sprintf("final_%s.json", safe(collegeName))
	file, _ := json.MarshalIndent(data, "", "  ")
	_ = os.WriteFile(outPath, file, 0644)

	fmt.Printf("\n Saved → %s\n", outPath)
}
