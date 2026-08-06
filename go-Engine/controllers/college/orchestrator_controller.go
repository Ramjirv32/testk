package college

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"gobackend/utils"
)

var (
	activePipelines   = make(map[string]bool)
	activePipelinesMu sync.Mutex
)

// cleanCollegeName normalizes a college name to match the slug format used in Python scripts.
func cleanCollegeName(name string) string {
	translit := map[rune]string{
		'à': "a", 'á': "a", 'â': "a", 'ã': "a", 'ä': "a", 'å': "a", 'æ': "ae", 'ç': "c",
		'è': "e", 'é': "e", 'ê': "e", 'ë': "e", 'ì': "i", 'í': "i", 'î': "i", 'ï': "i",
		'ð': "d", 'ñ': "n", 'ò': "o", 'ó': "o", 'ô': "o", 'õ': "o", 'ö': "o", 'ù': "u",
		'ú': "u", 'û': "u", 'ü': "u", 'ý': "y", 'þ': "th", 'ß': "ss", 'ÿ': "y",
		'À': "a", 'Á': "a", 'Â': "a", 'Ã': "a", 'Ä': "a", 'Å': "a", 'Æ': "ae", 'Ç': "c",
		'È': "e", 'É': "e", 'Ê': "e", 'Ë': "e", 'Ì': "i", 'Í': "i", 'Î': "i", 'Ï': "i",
		'Ð': "d", 'Ñ': "n", 'Ò': "o", 'Ó': "o", 'Ô': "o", 'Õ': "o", 'Ö': "o", 'Ù': "u",
		'Ú': "u", 'Û': "u", 'Ü': "u", 'Ý': "y", 'Þ': "th", 'ş': "s", 'Ş': "s",
		'ğ': "g", 'Ğ': "g", 'ı': "i", 'İ': "i",
	}

	var sb strings.Builder
	for _, r := range name {
		if val, ok := translit[r]; ok {
			sb.WriteString(val)
		} else if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') {
			sb.WriteRune(r)
		} else {
			sb.WriteRune('_')
		}
	}
	s := strings.ToLower(sb.String())
	for strings.Contains(s, "__") {
		s = strings.ReplaceAll(s, "__", "_")
	}
	return strings.Trim(s, "_")
}

func isYearDirectory(name string) bool {
	if len(name) != 4 {
		return false
	}
	for i := 0; i < len(name); i++ {
		if name[i] < '0' || name[i] > '9' {
			return false
		}
	}
	return true
}

func getStudyportalsOutputDir(level, uniSlug string) string {
	basePath := filepath.Join(utils.GetProjectRoot(), "studyportals")
	currentYear := fmt.Sprintf("%d", time.Now().Year())

	// 1. Check if it already exists in the current year
	path := filepath.Join(basePath, currentYear, level, uniSlug)
	if _, err := os.Stat(path); err == nil {
		return path
	}

	// 2. Check other digit-named directories (years)
	if entries, err := os.ReadDir(basePath); err == nil {
		for _, entry := range entries {
			if entry.IsDir() && isYearDirectory(entry.Name()) && entry.Name() != currentYear {
				p := filepath.Join(basePath, entry.Name(), level, uniSlug)
				if _, err := os.Stat(p); err == nil {
					return p
				}
			}
		}
	}

	// 3. Check legacy path (no year)
	legacyPath := filepath.Join(basePath, level, uniSlug)
	if _, err := os.Stat(legacyPath); err == nil {
		return legacyPath
	}

	// Default to current year path
	return path
}

func isStudyLevelDone(level, uniSlug string) bool {
	dir := getStudyportalsOutputDir(level, uniSlug)
	metaPath := filepath.Join(dir, "meta.json")
	fi, err := os.Stat(metaPath)
	if err != nil {
		return false
	}

	// Check if file modification time is within 1 year (365 days)
	if time.Since(fi.ModTime()) >= 365*24*time.Hour {
		return false
	}

	data, err := os.ReadFile(metaPath)
	if err != nil {
		return false
	}

	var meta struct {
		Steps map[string]interface{} `json:"steps"`
	}
	if err := json.Unmarshal(data, &meta); err != nil {
		return false
	}

	if meta.Steps == nil {
		return false
	}

	return meta.Steps["extraction_done"] == "done"
}

func isPlacementDone(slug string) bool {
	baseDir := filepath.Join(utils.GetProjectRoot(), "placement/final")
	currentYear := fmt.Sprintf("%d", time.Now().Year())
	prevYear := fmt.Sprintf("%d", time.Now().Year()-1)

	paths := []string{
		filepath.Join(baseDir, currentYear, slug+"_final.json"),
		filepath.Join(baseDir, prevYear, slug+"_final.json"),
		filepath.Join(baseDir, slug+"_final.json"),
	}

	for _, p := range paths {
		if fi, err := os.Stat(p); err == nil {
			if time.Since(fi.ModTime()) < 365*24*time.Hour {
				return true
			}
		}
	}
	return false
}

func isStudentStatsDone(slug string) bool {
	baseDir := filepath.Join(utils.GetProjectRoot(), "examples/studentstats/final")
	currentYear := fmt.Sprintf("%d", time.Now().Year())
	prevYear := fmt.Sprintf("%d", time.Now().Year()-1)

	paths := []string{
		filepath.Join(baseDir, currentYear, slug+"_final.json"),
		filepath.Join(baseDir, prevYear, slug+"_final.json"),
		filepath.Join(baseDir, slug+"_final.json"),
	}

	for _, p := range paths {
		if fi, err := os.Stat(p); err == nil {
			if time.Since(fi.ModTime()) < 365*24*time.Hour {
				return true
			}
		}
	}
	return false
}

// OrchestrateCollege handles the request to check and automatically start the academic data pipelines.
func OrchestrateCollege(w http.ResponseWriter, r *http.Request) {
	collegeName := r.URL.Query().Get("college_name")
	if collegeName == "" {
		collegeName = r.URL.Query().Get("college")
	}
	if collegeName == "" {
		collegeName = r.URL.Query().Get("q")
	}

	if collegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "college_name query parameter required"})
		return
	}

	country := r.URL.Query().Get("country")
	if country == "" {
		country = "US"
	}
	_ = r.URL.Query().Get("location")

	slug := cleanCollegeName(collegeName)

	log.Printf(" [Orchestrator] Request received for: %s (Country: %s, Slug: %s)", collegeName, country, slug)

	// 1. Check Serper Cache file
	serperCachePath := filepath.Join(utils.GetProjectRoot(), "serper_cache", slug+".json")
	hasSerperCache := false
	if _, err := os.Stat(serperCachePath); err == nil {
		hasSerperCache = true
	}

	if hasSerperCache {
		// Read serper cache and return immediately
		data, err := os.ReadFile(serperCachePath)
		if err == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(data)

			// Trigger portals in parallel
			go checkAndTriggerPortals(collegeName, country, slug)
			return
		}
	}

	// 2. Trigger the Go Orchestrator Backend API /api/run to start the full scraping pipeline
	orchestratorURL := os.Getenv("ORCHESTRATOR_URL")
	if orchestratorURL == "" {
		orchestratorURL = "http://localhost:4300"
	}
	runURL := fmt.Sprintf("%s/api/run", strings.TrimSuffix(orchestratorURL, "/"))

	requestBody, _ := json.Marshal(map[string]interface{}{
		"college_name": collegeName,
		"modes":        "",
		"year":         "2026",
	})

	resp, err := http.Post(runURL, "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		log.Printf(" [Orchestrator] Error calling Go orchestrator: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error":   "Failed to contact Go orchestrator backend",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to read orchestrator response"})
		return
	}

	// Spawn background check and trigger for portals
	go checkAndTriggerPortals(collegeName, country, slug)

	// Return Go orchestrator response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(bodyBytes)
}

func checkAndTriggerPortals(collegeName, country, slug string) {
	// A. Study Portals Check & Run
	levels := []string{"ug", "pg", "phd", "ug_scholarship", "pg_scholarship", "phd_scholarship"}
	var remainingLevels []string
	for _, lvl := range levels {
		if !isStudyLevelDone(lvl, slug) {
			remainingLevels = append(remainingLevels, lvl)
		}
	}

	if len(remainingLevels) > 0 {
		log.Printf(" [Orchestrator] StudyPortals levels not completed: %v", remainingLevels)
		triggerStudyPortal(collegeName, remainingLevels, slug)
	} else {
		log.Printf(" [Orchestrator] StudyPortals is fully up to date (< 1 year) for %s", collegeName)
	}

	// B. Placements Check & Run
	if !isPlacementDone(slug) {
		log.Printf(" [Orchestrator] Placement info not completed/stale for: %s", collegeName)
		triggerPlacement(collegeName, country, slug)
	} else {
		log.Printf(" [Orchestrator] Placement is up to date (< 1 year) for %s", collegeName)
	}

	// C. Student Stats Check & Run
	if !isStudentStatsDone(slug) {
		log.Printf(" [Orchestrator] Student stats info not completed/stale for: %s", collegeName)
		triggerStudentStats(collegeName, country, slug)
	} else {
		log.Printf(" [Orchestrator] Student stats is up to date (< 1 year) for %s", collegeName)
	}
}

func triggerStudyPortal(collegeName string, levels []string, slug string) {
	jobKey := slug + "_study"
	activePipelinesMu.Lock()
	if activePipelines[jobKey] {
		activePipelinesMu.Unlock()
		log.Printf(" [Orchestrator] StudyPortals pipeline already running for %s", collegeName)
		return
	}
	activePipelines[jobKey] = true
	activePipelinesMu.Unlock()

	go func() {
		defer func() {
			activePipelinesMu.Lock()
			delete(activePipelines, jobKey)
			activePipelinesMu.Unlock()
		}()

		log.Printf(" [Orchestrator] Starting StudyPortals scraper for: %s (levels: %v)", collegeName, levels)
		logDir := filepath.Join(utils.GetProjectRoot(), "studyportals/logs")
		_ = os.MkdirAll(logDir, 0755)
		logPath := filepath.Join(logDir, "run.log")

		// Write initial log entry
		_ = os.WriteFile(logPath, []byte(fmt.Sprintf(" [Orchestrator] Running background pipeline for %s (levels: %v)\n", collegeName, levels)), 0644)
		logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			log.Printf(" [Orchestrator] Failed to open StudyPortals run.log: %v", err)
			return
		}
		defer logFile.Close()

		cmd := exec.Command("python3", "examples/studyportals_pipeline.py",
			"--universities", collegeName,
			"--levels", strings.Join(levels, ","),
			"--immediate",
			"--reextract")
		cmd.Dir = utils.GetProjectRoot()
		cmd.Stdout = logFile
		cmd.Stderr = logFile

		if err := cmd.Run(); err != nil {
			log.Printf(" [Orchestrator] StudyPortals pipeline failed: %v", err)
			_, _ = logFile.WriteString(fmt.Sprintf("\n StudyPortals pipeline finished with error: %v\n", err))
		} else {
			log.Printf(" [Orchestrator] StudyPortals pipeline succeeded. Running consolidation...")
			_, _ = logFile.WriteString("\n Pipeline completed successfully. Running consolidation...\n")

			consCmd := exec.Command("python3", "examples/consolidate_studyportals.py")
			consCmd.Dir = utils.GetProjectRoot()
			consCmd.Stdout = logFile
			consCmd.Stderr = logFile
			if err := consCmd.Run(); err != nil {
				log.Printf(" [Orchestrator] StudyPortals consolidation failed: %v", err)
			} else {
				log.Printf(" [Orchestrator] StudyPortals consolidation completed.")
			}
		}
	}()
}

func triggerPlacement(collegeName, country, slug string) {
	jobKey := slug + "_placement"
	activePipelinesMu.Lock()
	if activePipelines[jobKey] {
		activePipelinesMu.Unlock()
		log.Printf(" [Orchestrator] Placement scraper already running for %s", collegeName)
		return
	}
	activePipelines[jobKey] = true
	activePipelinesMu.Unlock()

	go func() {
		defer func() {
			activePipelinesMu.Lock()
			delete(activePipelines, jobKey)
			activePipelinesMu.Unlock()
		}()

		log.Printf(" [Orchestrator] Starting Placement scraper for: %s", collegeName)
		logDir := filepath.Join(utils.GetProjectRoot(), "placement/logs")
		_ = os.MkdirAll(logDir, 0755)
		logPath := filepath.Join(logDir, "run.log")

		_ = os.WriteFile(logPath, []byte(fmt.Sprintf(" [Orchestrator] Running background placement scraper for %s\n", collegeName)), 0644)
		logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			log.Printf(" [Orchestrator] Failed to open placement run.log: %v", err)
			return
		}
		defer logFile.Close()

		cmd := exec.Command("python3", "placement_scraper.py", "--college", collegeName, "--country", country)
		cmd.Dir = filepath.Join(utils.GetProjectRoot(), "placement")
		cmd.Stdout = logFile
		cmd.Stderr = logFile

		if err := cmd.Run(); err != nil {
			log.Printf(" [Orchestrator] Placement scraper failed: %v", err)
		} else {
			log.Printf(" [Orchestrator] Placement scraper completed successfully for %s", collegeName)
		}
	}()
}

func triggerStudentStats(collegeName, country, slug string) {
	jobKey := slug + "_studentstats"
	activePipelinesMu.Lock()
	if activePipelines[jobKey] {
		activePipelinesMu.Unlock()
		log.Printf(" [Orchestrator] Student stats scraper already running for %s", collegeName)
		return
	}
	activePipelines[jobKey] = true
	activePipelinesMu.Unlock()

	go func() {
		defer func() {
			activePipelinesMu.Lock()
			delete(activePipelines, jobKey)
			activePipelinesMu.Unlock()
		}()

		log.Printf(" [Orchestrator] Starting Student Stats scraper for: %s", collegeName)
		logDir := filepath.Join(utils.GetProjectRoot(), "examples/studentstats/logs")
		_ = os.MkdirAll(logDir, 0755)
		logPath := filepath.Join(logDir, "run.log")

		_ = os.WriteFile(logPath, []byte(fmt.Sprintf(" [Orchestrator] Running background student stats scraper for %s\n", collegeName)), 0644)
		logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			log.Printf(" [Orchestrator] Failed to open student stats run.log: %v", err)
			return
		}
		defer logFile.Close()

		cmd := exec.Command("python3", "student_stats_scraper.py", "--college", collegeName, "--country", country)
		cmd.Dir = filepath.Join(utils.GetProjectRoot(), "examples/studentstats")
		cmd.Stdout = logFile
		cmd.Stderr = logFile

		if err := cmd.Run(); err != nil {
			log.Printf(" [Orchestrator] Student stats scraper failed: %v", err)
		} else {
			log.Printf(" [Orchestrator] Student stats scraper completed successfully for %s", collegeName)
		}
	}()
}
