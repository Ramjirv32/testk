package qsranking

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"gobackend/models"
	qsrankingsvc "gobackend/services/qsranking"
	"gobackend/utils"

	"go.mongodb.org/mongo-driver/bson"
)

func GetConfig(w http.ResponseWriter, _ *http.Request) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	settings, err := qsrankingsvc.EnsureSettings(ctx)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, settings)
}

func List(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	perPage, _ := strconv.Atoi(query.Get("limit"))
	year, _ := strconv.Atoi(query.Get("year"))
	rankMin, _ := strconv.Atoi(query.Get("rank_min"))
	rankMax, _ := strconv.Atoi(query.Get("rank_max"))
	scoreMin, _ := strconv.ParseFloat(query.Get("score_min"), 64)
	tuitionMax, _ := strconv.Atoi(query.Get("tuition_max"))
	filters := qsrankingsvc.RankingFilters{
		Search: query.Get("search"), Country: query.Get("country"),
		RankMin: rankMin, RankMax: rankMax, ScoreMin: scoreMin,
		Discipline: query.Get("discipline"), TuitionMax: tuitionMax,
		UniversityType: query.Get("university_type"), Format: query.Get("format"),
		Degree: query.Get("degree"), SpecialProgram: query.Get("special_program"),
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	response, err := qsrankingsvc.ListRankings(ctx, page, perPage, year, filters)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, response)
}

func UpdateConfig(w http.ResponseWriter, r *http.Request) {
	var settings models.QSScraperSettings
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&settings); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid settings JSON: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	saved, err := qsrankingsvc.SaveSettings(ctx, settings)
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, saved)
}

func Run(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	settings, err := qsrankingsvc.EnsureSettings(ctx)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	status, err := qsrankingsvc.StartOrchestrator(settings)
	if errors.Is(err, qsrankingsvc.ErrAlreadyRunning) {
		utils.RespondJSON(w, http.StatusConflict, status)
		return
	}
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusAccepted, status)
}

func Status(w http.ResponseWriter, _ *http.Request) {
	utils.RespondJSON(w, http.StatusOK, qsrankingsvc.GetRunStatus())
}

func Abort(w http.ResponseWriter, _ *http.Request) {
	status, err := qsrankingsvc.AbortOrchestrator()
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusAccepted, status)
}

func Schedule(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	status, err := qsrankingsvc.GetScheduleStatus(ctx, time.Now().UTC())
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, status)
}

func Import(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()
	count, err := qsrankingsvc.ImportDefaultRankings(ctx)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	profileCount, profileErr := qsrankingsvc.ImportDefaultProfiles(ctx)
	if profileErr != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": profileErr.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{"imported_count": count, "imported_profiles": profileCount, "collection": "qs_rankings"})
}

func IngestProfile(w http.ResponseWriter, r *http.Request) {
	var profile bson.M
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid profile JSON: " + err.Error()})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	if err := qsrankingsvc.UpsertProfile(ctx, profile); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{"stored": true, "college_name": profile["college_name"]})
}

func DirectoryList(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	limit, _ := strconv.Atoi(query.Get("limit"))
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	response, err := qsrankingsvc.ListDirectory(ctx, page, limit, qsrankingsvc.RankingFilters{Search: query.Get("search"), Country: query.Get("country")})
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, response)
}

func DirectoryConfig(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	if r.Method == http.MethodGet {
		settings, err := qsrankingsvc.EnsureDirectorySettings(ctx)
		if err != nil {
			utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
			return
		}
		utils.RespondJSON(w, http.StatusOK, settings)
		return
	}
	var settings models.QSScraperSettings
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&settings); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid settings JSON: " + err.Error()})
		return
	}
	saved, err := qsrankingsvc.SaveDirectorySettings(ctx, settings)
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, saved)
}

func DirectoryRun(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	settings, err := qsrankingsvc.EnsureDirectorySettings(ctx)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	status, err := qsrankingsvc.StartDirectoryOrchestrator(settings)
	if errors.Is(err, qsrankingsvc.ErrDirectoryAlreadyRunning) {
		utils.RespondJSON(w, http.StatusConflict, status)
		return
	}
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusAccepted, status)
}

func DirectoryStatus(w http.ResponseWriter, _ *http.Request) {
	utils.RespondJSON(w, http.StatusOK, qsrankingsvc.GetDirectoryRunStatus())
}

func DirectoryAbort(w http.ResponseWriter, _ *http.Request) {
	status, err := qsrankingsvc.AbortDirectoryOrchestrator()
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusAccepted, status)
}

func DirectorySchedule(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	status, err := qsrankingsvc.GetDirectoryScheduleStatus(ctx, time.Now().UTC())
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, status)
}

func DirectoryImport(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Minute)
	defer cancel()
	count, err := qsrankingsvc.ImportDefaultDirectory(ctx)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{"imported_count": count, "collection": "qs_university_directory"})
}
