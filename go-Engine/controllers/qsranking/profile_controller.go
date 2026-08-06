package qsranking

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"gobackend/config"
	qsrankingsvc "gobackend/services/qsranking"
	"gobackend/utils"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
)

var profileUpgrader = websocket.Upgrader{CheckOrigin: func(_ *http.Request) bool { return true }}

func profileByName(ctx context.Context, name string) (bson.M, bool) {
	var profile bson.M
	filter := bson.M{"college_name": bson.M{"$regex": "^" + regexp.QuoteMeta(strings.TrimSpace(name)) + "$", "$options": "i"}}
	if config.QSUniversityProfilesCollection.FindOne(ctx, filter).Decode(&profile) == nil {
		delete(profile, "_id")
		delete(profile, "key")
		return profile, true
	}
	return nil, false
}

func rankingByName(ctx context.Context, name string) (bson.M, bool) {
	var ranking bson.M
	filter := bson.M{"name": bson.M{"$regex": "^" + regexp.QuoteMeta(strings.TrimSpace(name)) + "$", "$options": "i"}}
	if config.QSRankingsCollection.FindOne(ctx, filter).Decode(&ranking) == nil {
		ranking["dataset"] = "qs_rankings"
		delete(ranking, "_id")
		return ranking, true
	}
	if config.QSUniversityDirectoryCollection.FindOne(ctx, filter).Decode(&ranking) == nil {
		ranking["dataset"] = "all_universities"
		if _, exists := ranking["ranking_year"]; !exists {
			ranking["ranking_year"] = currentDirectoryYear()
		}
		delete(ranking, "_id")
		return ranking, true
	}
	return nil, false
}

func currentDirectoryYear() int {
	now := time.Now().UTC()
	if now.Month() >= time.June {
		return now.Year() + 1
	}
	return now.Year()
}

func intValue(value interface{}) int {
	switch typed := value.(type) {
	case int:
		return typed
	case int32:
		return int(typed)
	case int64:
		return int(typed)
	case float64:
		return int(typed)
	default:
		parsed, _ := strconv.Atoi(strings.TrimSpace(fmt.Sprint(value)))
		return parsed
	}
}

func profileIsCurrent(profile, ranking bson.M) bool {
	status := strings.ToLower(strings.TrimSpace(fmt.Sprint(profile["scrape_status"])))
	if status != "" && status != "<nil>" && status != "complete" {
		return false
	}
	expectedYear := intValue(ranking["ranking_year"])
	profileYear := intValue(profile["ranking_year"])
	if profileYear > 0 && expectedYear > 0 {
		return profileYear == expectedYear
	}
	// Compatibility for profiles created before ranking_year was stored.
	if scrapedAt, ok := profile["scraped_at"].(string); ok {
		if parsed, err := time.Parse(time.RFC3339, scrapedAt); err == nil {
			return parsed.Year() == time.Now().UTC().Year()
		}
	}
	return false
}

func Profile(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimSpace(r.URL.Query().Get("name"))
	if name == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	ranking, ok := rankingByName(ctx, name)
	if !ok {
		utils.RespondJSON(w, http.StatusNotFound, map[string]string{"error": "QS university not found"})
		return
	}
	if profile, found := profileByName(ctx, name); found {
		if profileIsCurrent(profile, ranking) {
			utils.RespondJSON(w, http.StatusOK, bson.M{"status": "ready", "profile": profile, "ranking": ranking})
			return
		}
		utils.RespondJSON(w, http.StatusOK, bson.M{"status": "scraping", "running": qsrankingsvc.IsProfileRunning(name), "ranking": ranking, "profile": profile})
		return
	}
	utils.RespondJSON(w, http.StatusOK, bson.M{"status": "pending", "running": qsrankingsvc.IsProfileRunning(name), "ranking": ranking})
}

func RunProfile(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name string `json:"name"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil || strings.TrimSpace(body.Name) == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	ranking, ok := rankingByName(ctx, body.Name)
	if !ok {
		utils.RespondJSON(w, http.StatusNotFound, map[string]string{"error": "QS university not found"})
		return
	}
	if profile, found := profileByName(ctx, body.Name); found && profileIsCurrent(profile, ranking) {
		utils.RespondJSON(w, http.StatusOK, bson.M{"status": "ready", "profile": profile, "cached": true})
		return
	}
	err := qsrankingsvc.StartProfileScrape(body.Name)
	if errors.Is(err, qsrankingsvc.ErrAlreadyRunning) {
		utils.RespondJSON(w, http.StatusOK, bson.M{"status": "scraping", "already_running": true})
		return
	}
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusAccepted, bson.M{"status": "scraping", "started": true})
}

func ProfileSocket(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimSpace(r.URL.Query().Get("name"))
	connection, err := profileUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer connection.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	ranking, rankingFound := rankingByName(ctx, name)
	cancel()
	if !rankingFound {
		_ = connection.WriteJSON(bson.M{"status": "error", "error": "QS university not found"})
		return
	}
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		profile, found := profileByName(ctx, name)
		cancel()
		ready := found && profileIsCurrent(profile, ranking)
		payload := bson.M{"status": "scraping", "running": qsrankingsvc.IsProfileRunning(name), "ranking": ranking}
		if found {
			payload["profile"] = profile
		}
		if ready {
			payload = bson.M{"status": "ready", "profile": profile}
		}
		if connection.WriteJSON(payload) != nil || ready {
			return
		}
		<-ticker.C
	}
}
