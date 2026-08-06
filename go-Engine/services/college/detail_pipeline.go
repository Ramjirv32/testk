package collegesvc

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"gobackend/config"
	"gobackend/services/realtime"
	"gobackend/utils"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// DetailPipelineStatus describes the shared InitialThree job for one college.
// A single in-process job is shared by every browser requesting that college.
type DetailPipelineStatus struct {
	PipelineID     string `json:"pipeline_id"`
	Status         string `json:"status"`
	Generation     int    `json:"generation"`
	Started        bool   `json:"started"`
	AlreadyRunning bool   `json:"already_running"`
	Complete       bool   `json:"complete"`
}

type detailPipelineMonitorState struct {
	seen          map[string][32]byte
	completeSince time.Time
}

var detailPipelineMonitors = struct {
	sync.Mutex
	items map[string]*detailPipelineMonitorState
}{items: make(map[string]*detailPipelineMonitorState)}

var nonSlugCharacters = regexp.MustCompile(`[^a-z0-9]+`)

func detailPipelineKey(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = nonSlugCharacters.ReplaceAllString(value, "-")
	return strings.Trim(value, "-")
}

func detailPipelineYear() int {
	if raw := strings.TrimSpace(os.Getenv("BROWSEROS_RESULTS_YEAR")); raw != "" {
		if year, err := strconv.Atoi(raw); err == nil && year >= 2000 {
			return year
		}
	}
	return time.Now().Year()
}

// EnsureCollegeDetailPipeline returns immediately. It never waits for the six
// branches: durable task records are dispatched through RabbitMQ, while one
// shared monitor ingests each Fullcollgeslist JSON file as it arrives.
func EnsureCollegeDetailPipeline(collegeName, country, originalQuery string) (DetailPipelineStatus, error) {
	collegeName = strings.TrimSpace(collegeName)
	if collegeName == "" {
		return DetailPipelineStatus{}, fmt.Errorf("college name is required")
	}
	if strings.TrimSpace(country) == "" {
		country = "US"
	}
	run, created, err := ensureDurablePipeline(collegeName, country, originalQuery, false)
	if err != nil {
		return DetailPipelineStatus{}, err
	}
	active := run.Status == "queued" || run.Status == "running" || run.Status == "tasks_complete"
	return DetailPipelineStatus{
		PipelineID: run.ID, Status: run.Status, Generation: run.Generation,
		Started: created && active, AlreadyRunning: !created && active, Complete: run.Status == "completed",
	}, nil
}

func ForceCollegeDetailPipeline(collegeName, country, originalQuery string) (DetailPipelineStatus, error) {
	run, created, err := ensureDurablePipeline(collegeName, country, originalQuery, true)
	if err != nil {
		return DetailPipelineStatus{}, err
	}
	return DetailPipelineStatus{PipelineID: run.ID, Status: run.Status, Generation: run.Generation, Started: created}, nil
}

func pipelineMonitorLoop(ctx context.Context) {
	interval := 5 * time.Second
	if raw := strings.TrimSpace(os.Getenv("PIPELINE_MONITOR_INTERVAL_SECONDS")); raw != "" {
		if seconds, err := strconv.Atoi(raw); err == nil && seconds > 0 {
			interval = time.Duration(seconds) * time.Second
		}
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			monitorDurableRuns(ctx)
		}
	}
}

func monitorDurableRuns(ctx context.Context) {
	cursor, err := config.PipelineRunsCollection.Find(ctx, bson.M{"status": bson.M{"$in": []string{"queued", "running", "tasks_complete"}}}, options.Find().SetBatchSize(500))
	if err != nil {
		return
	}
	defer cursor.Close(ctx)
	var runs []PipelineRun
	if cursor.All(ctx, &runs) != nil {
		return
	}
	bundles := indexFullCollegeBundles(detailPipelineYear())
	now := time.Now().UTC()
	var maxAge time.Duration
	if raw := strings.TrimSpace(os.Getenv("PIPELINE_RUN_TIMEOUT_HOURS")); raw != "" {
		if hours, err := strconv.Atoi(raw); err == nil && hours > 0 {
			maxAge = time.Duration(hours) * time.Hour
		}
	}
	for _, run := range runs {
		if maxAge > 0 && !run.CreatedAt.IsZero() && now.Sub(run.CreatedAt) > maxAge {
			_, _ = config.PipelineRunsCollection.UpdateOne(ctx, bson.M{"_id": run.ID, "status": bson.M{"$in": []string{"queued", "running", "tasks_complete"}}}, bson.M{"$set": bson.M{"status": "failed", "failure_reason": "pipeline timed out", "updated_at": now}})
			realtime.BroadcastCollegeScrapingUpdate(run.CollegeName, "pipeline_error", map[string]interface{}{"college_name": run.CollegeName, "pipeline_id": run.ID, "error": "pipeline timed out"})
			forgetPipelineMonitor(run.ID)
			continue
		}
		detailPipelineMonitors.Lock()
		state := detailPipelineMonitors.items[run.ID]
		if state == nil {
			state = &detailPipelineMonitorState{seen: make(map[string][32]byte)}
			detailPipelineMonitors.items[run.ID] = state
		}
		detailPipelineMonitors.Unlock()
		bundleDir := bundles[detailPipelineKey(run.CollegeName)]
		if bundleDir == "" {
			continue
		}
		changed := ingestFullCollegeBundle(run.CollegeName, run.OriginalQuery, run.Country, run.ID, bundleDir, state.seen, false)
		if changed > 0 {
			state.completeSince = time.Time{}
		}
		if run.Status != "tasks_complete" || !fullCollegeBundleComplete(bundleDir) {
			continue
		}
		if state.completeSince.IsZero() {
			state.completeSince = time.Now()
			continue
		}
		if time.Since(state.completeSince) < 45*time.Second {
			continue
		}
		ingestFullCollegeBundle(run.CollegeName, run.OriginalQuery, run.Country, run.ID, bundleDir, state.seen, true)
		_, _ = config.PipelineRunsCollection.UpdateOne(ctx, bson.M{"_id": run.ID}, bson.M{"$set": bson.M{"status": "completed", "completed_at": time.Now().UTC(), "updated_at": time.Now().UTC()}})
		NotifyPipelineCompleteWithID(run.CollegeName, run.ID)
		if run.OriginalQuery != "" && detailPipelineKey(run.OriginalQuery) != detailPipelineKey(run.CollegeName) {
			realtime.BroadcastCollegeScrapingUpdate(run.OriginalQuery, "pipeline_complete", map[string]interface{}{"college_name": run.CollegeName, "pipeline_id": run.ID})
		}
		forgetPipelineMonitor(run.ID)
	}
}

func forgetPipelineMonitor(pipelineID string) {
	detailPipelineMonitors.Lock()
	delete(detailPipelineMonitors.items, pipelineID)
	detailPipelineMonitors.Unlock()
}

// Build the directory lookup once per monitoring pass. This keeps monitoring
// O(number of active pipelines + number of result directories), instead of
// running a filesystem glob once for every queued college.
func indexFullCollegeBundles(year int) map[string]string {
	indexed := make(map[string]string)
	root := filepath.Join(utils.GetProjectRoot(), "Fullcollgeslist")
	candidates, err := filepath.Glob(filepath.Join(root, "*", strconv.Itoa(year), "*"))
	if err != nil {
		return indexed
	}
	for _, candidate := range candidates {
		if info, statErr := os.Stat(candidate); statErr == nil && info.IsDir() {
			indexed[detailPipelineKey(filepath.Base(candidate))] = candidate
		}
	}
	return indexed
}

// findFullCollegeBundle intentionally scans every country folder because the
// legacy merger may place non-US colleges under Fullcollgeslist/US.
func findFullCollegeBundle(collegeName string, year int) (string, error) {
	root := filepath.Join(utils.GetProjectRoot(), "Fullcollgeslist")
	pattern := filepath.Join(root, "*", strconv.Itoa(year), "*")
	candidates, err := filepath.Glob(pattern)
	if err != nil {
		return "", err
	}
	wanted := detailPipelineKey(collegeName)
	var partial string
	for _, candidate := range candidates {
		info, statErr := os.Stat(candidate)
		if statErr != nil || !info.IsDir() {
			continue
		}
		candidateKey := detailPipelineKey(filepath.Base(candidate))
		if candidateKey == wanted {
			return candidate, nil
		}
		if partial == "" && len(wanted) >= 5 && (strings.Contains(candidateKey, wanted) || strings.Contains(wanted, candidateKey)) {
			partial = candidate
		}
	}
	return partial, nil
}

func fullCollegeBundleComplete(dir string) bool {
	required := []string{
		"ug.json", "pg.json", "phd.json", "scholarships.json",
		"placements.json", "studentstats.json",
		"admissions.json", "departments.json", "infrastructure_accommodations.json",
		"online.json", "alumni.json", "portals.json", "about.json",
	}
	for _, name := range required {
		if info, err := os.Stat(filepath.Join(dir, name)); err != nil || info.Size() <= 2 {
			return false
		}
	}
	return true
}

func isFullCollegeDataFile(filename string) bool {
	switch filename {
	case "ug.json", "pg.json", "phd.json", "scholarships.json",
		"placements.json", "studentstats.json", "admissions.json",
		"departments.json", "infrastructure_accommodations.json",
		"online.json", "alumni.json", "events.json", "rankings.json",
		"portals.json", "about.json":
		return true
	default:
		return false
	}
}

func sectionForFullCollegeFile(filename string) string {
	switch filename {
	case "ug.json", "pg.json", "phd.json", "departments.json", "online.json":
		return "programs"
	case "scholarships.json":
		return "scholarships"
	case "placements.json":
		return "placements"
	case "infrastructure_accommodations.json":
		return "infrastructure"
	case "rankings.json":
		return "ranking"
	case "about.json", "studentstats.json":
		return "basic_info"
	case "admissions.json":
		return "admissions"
	case "alumni.json":
		return "alumni"
	case "events.json":
		return "events"
	case "portals.json":
		return "portals"
	default:
		return strings.TrimSuffix(filename, filepath.Ext(filename))
	}
}

func ingestFullCollegeBundle(collegeName, query, country, pipelineID, dir string, seen map[string][32]byte, final bool) int {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return 0
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	changed := 0
	for _, entry := range entries {
		if entry.IsDir() || !isFullCollegeDataFile(entry.Name()) {
			continue
		}
		path := filepath.Join(dir, entry.Name())
		raw, readErr := os.ReadFile(path)
		if readErr != nil || len(bytes.TrimSpace(raw)) <= 2 {
			continue
		}
		hash := sha256.Sum256(raw)
		if seen != nil {
			if oldHash, exists := seen[entry.Name()]; exists && oldHash == hash {
				continue
			}
			seen[entry.Name()] = hash
		}
		var object map[string]interface{}
		if err := json.Unmarshal(raw, &object); err != nil {
			var value interface{}
			if json.Unmarshal(raw, &value) != nil {
				continue
			}
			object = map[string]interface{}{"items": value}
		}
		UpdateSectionAndFileInCacheForPipeline(collegeName, query, sectionForFullCollegeFile(entry.Name()), entry.Name(), pipelineID, object)
		changed++
	}
	if changed > 0 || final {
		syncFullCollegeBundleToMongo(collegeName, country, dir)
	}
	return changed
}

func syncFullCollegeBundleToMongo(collegeName, country, dir string) {
	if config.TruDB == nil {
		return
	}
	collegeSlug := filepath.Base(dir)
	storageCountry := filepath.Base(filepath.Dir(filepath.Dir(dir)))
	document := bson.M{
		"college_slug":      collegeSlug,
		"college_name":      collegeName,
		"university_name":   collegeName,
		"country":           storageCountry,
		"requested_country": country,
		"year":              detailPipelineYear(),
		"bundle_path":       dir,
		"updated_at":        time.Now(),
	}
	entries, _ := os.ReadDir(dir)
	for _, entry := range entries {
		if entry.IsDir() || !isFullCollegeDataFile(entry.Name()) {
			continue
		}
		raw, err := os.ReadFile(filepath.Join(dir, entry.Name()))
		if err != nil {
			continue
		}
		var value interface{}
		if json.Unmarshal(raw, &value) == nil {
			key := strings.TrimSuffix(entry.Name(), ".json")
			document[key] = value
			if key == "about" {
				if about, ok := value.(map[string]interface{}); ok {
					if name, ok := about["university_name"].(string); ok && strings.TrimSpace(name) != "" {
						document["university_name"] = name
					} else if name, ok := about["institution_name"].(string); ok && strings.TrimSpace(name) != "" {
						document["university_name"] = name
					}
				}
			}
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	_, err := config.TruDB.Collection("merged_colleges").ReplaceOne(
		ctx,
		bson.M{"college_slug": collegeSlug, "country": storageCountry},
		document,
		options.Replace().SetUpsert(true),
	)
	if err != nil {
		log.Printf("[InitialThree] merged_colleges sync failed for %s: %v", collegeName, err)
	}
}
