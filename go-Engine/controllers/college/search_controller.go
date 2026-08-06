package college

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strings"

	collegesvc "gobackend/services/college"
	"gobackend/utils"
)

func SearchUniversity(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("university_name")
	if name == "" {
		name = r.URL.Query().Get("q")
	}

	if name == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "university_name required"})
		return
	}

	result, err := collegesvc.GetCollegeFromCache(name)
	if err == nil && result != nil {
		utils.RespondJSON(w, http.StatusOK, result)
		return
	}

	nameWithSpaces := strings.ReplaceAll(name, "-", " ")
	if nameWithSpaces != name {
		result, err = collegesvc.GetCollegeFromCache(nameWithSpaces)
		if err == nil && result != nil {
			utils.RespondJSON(w, http.StatusOK, result)
			return
		}
	}

	valReq := collegesvc.CollegeValidationRequest{CollegeName: name}
	validated := collegesvc.ValidateCollegeName(valReq)
	if validated.IsValid {
		name = validated.Name
		result, err = collegesvc.GetCollegeFromCache(name)
		if err == nil && result != nil {
			utils.RespondJSON(w, http.StatusOK, result)
			return
		}
	}

	country := r.URL.Query().Get("country")
	location := r.URL.Query().Get("city")

	log.Printf(" College not found in database, fetching from Serper API: %s", name)
	serperResult := collegesvc.StartScrapingFlowSync(name, country, location)
	if serperResult == nil {
		log.Printf(" Failed to fetch from Serper API: %s", name)
		utils.RespondJSON(w, http.StatusNotFound, map[string]string{"error": "University not found in database or Serper API"})
		return
	}

	utils.RespondJSON(w, http.StatusOK, serperResult)
}

func GetAllColleges(w http.ResponseWriter, r *http.Request) {
	colleges, err := collegesvc.GetAllColleges()
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusOK, colleges)
}

type CheckOrStartRequest struct {
	CollegeName string `json:"college_name"`
	Country     string `json:"country"`
	Location    string `json:"location"`
	Immediate   bool   `json:"immediate"`
}

func detailPipelineResponse(stats interface{}, collegeName, country string, cached bool, pipeline collegesvc.DetailPipelineStatus, pipelineErr error) map[string]interface{} {
	response := map[string]interface{}{
		"success":                  true,
		"found":                    true,
		"cached":                   cached,
		"source_cached":            cached,
		"pipeline_started":         pipeline.Started,
		"pipeline_already_running": pipeline.AlreadyRunning,
		"pipeline_complete":        pipeline.Complete,
		"pipeline_id":              pipeline.PipelineID,
		"pipeline_status":          pipeline.Status,
		"pipeline_generation":      pipeline.Generation,
		"mode":                     "serper+initialthree",
		"college_name":             collegeName,
		"country":                  country,
		"basic_info":               stats,
	}
	if pipeline.Started || pipeline.AlreadyRunning {
		response["stream_url"] = "/ws/college-details/" + url.PathEscape(collegeName)
	}
	if pipelineErr != nil {
		// Serper/cached data is still useful even when the background service is
		// temporarily unavailable, so expose the error without failing the request.
		response["pipeline_error"] = pipelineErr.Error()
	}
	return response
}

func ensureDetails(collegeName, country, originalQuery string) (collegesvc.DetailPipelineStatus, error) {
	return collegesvc.EnsureCollegeDetailPipeline(collegeName, country, originalQuery)
}

func CheckOrStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodOptions {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CheckOrStartRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}
	originalQuery := req.CollegeName

	// 1. Check DB Cache (skip if immediate=true)
	if !req.Immediate {
		cachedStats, err := collegesvc.GetCollegeFromCache(req.CollegeName)
		if err == nil && cachedStats != nil {
			pipeline, pipelineErr := ensureDetails(cachedStats.CollegeName, cachedStats.Country, originalQuery)
			response := detailPipelineResponse(cachedStats, cachedStats.CollegeName, cachedStats.Country, true, pipeline, pipelineErr)
			response["files"] = cachedStats.Files
			utils.RespondJSON(w, http.StatusOK, response)
			return
		}
	}

	// 2. Validate Name via Groq
	valReq := collegesvc.CollegeValidationRequest{
		CollegeName: req.CollegeName,
		Country:     req.Country,
		City:        req.Location,
	}
	validated := collegesvc.ValidateCollegeName(valReq)
	if validated.IsValid {
		req.CollegeName = validated.Name
		req.Country = validated.Country
		req.Location = validated.Location

		// 2.5 Re-check DB Cache with normalized name (skip if immediate=true)
		if !req.Immediate {
			cachedStats2, err2 := collegesvc.GetCollegeFromCache(req.CollegeName)
			if err2 == nil && cachedStats2 != nil {
				pipeline, pipelineErr := ensureDetails(cachedStats2.CollegeName, cachedStats2.Country, originalQuery)
				response := detailPipelineResponse(cachedStats2, cachedStats2.CollegeName, cachedStats2.Country, true, pipeline, pipelineErr)
				response["files"] = cachedStats2.Files
				utils.RespondJSON(w, http.StatusOK, response)
				return
			}
		}
	}

	// 3. Claim the durable pipeline before Serper. Concurrent first-time
	// requests therefore attach to one run instead of all entering Serper.
	pipeline, pipelineErr := ensureDetails(req.CollegeName, req.Country, originalQuery)
	if pipelineErr != nil {
		utils.RespondJSON(w, http.StatusServiceUnavailable, map[string]interface{}{
			"found": false, "pipeline_started": false, "error": pipelineErr.Error(),
		})
		return
	}
	if pipeline.AlreadyRunning {
		if cached, cacheErr := collegesvc.GetCollegeFromCache(req.CollegeName); cacheErr == nil && cached != nil {
			response := detailPipelineResponse(cached, cached.CollegeName, cached.Country, true, pipeline, nil)
			response["files"] = cached.Files
			utils.RespondJSON(w, http.StatusOK, response)
			return
		}
		minimal := map[string]interface{}{"college_name": req.CollegeName, "country": req.Country, "location": req.Location}
		utils.RespondJSON(w, http.StatusAccepted, detailPipelineResponse(minimal, req.CollegeName, req.Country, false, pipeline, nil))
		return
	}

	// 4. The winning request performs the fast Serper phase while all detailed
	// work is already safely represented as durable RabbitMQ tasks.
	serperResult := collegesvc.StartScrapingFlowSync(req.CollegeName, req.Country, req.Location)
	if serperResult == nil {
		minimal := map[string]interface{}{"college_name": req.CollegeName, "country": req.Country, "location": req.Location}
		response := detailPipelineResponse(minimal, req.CollegeName, req.Country, false, pipeline, nil)
		response["serper_error"] = "Serper lookup failed; detailed pipeline continues"
		utils.RespondJSON(w, http.StatusAccepted, response)
		return
	}

	response := detailPipelineResponse(serperResult, serperResult.CollegeName, serperResult.Country, false, pipeline, nil)
	response["files"] = serperResult.Files
	utils.RespondJSON(w, http.StatusOK, response)
}
