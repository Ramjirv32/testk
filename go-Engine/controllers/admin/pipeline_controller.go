package admin

import (
	"encoding/json"
	"net/http"

	collegesvc "gobackend/services/college"
	"gobackend/utils"
)

type forceCollegePipelineRequest struct {
	CollegeName string `json:"college_name"`
	Country     string `json:"country"`
}

func ForceCollegePipeline(w http.ResponseWriter, r *http.Request) {
	var request forceCollegePipelineRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil || request.CollegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "college_name is required"})
		return
	}
	status, err := collegesvc.ForceCollegeDetailPipeline(request.CollegeName, request.Country, request.CollegeName)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	utils.RespondJSON(w, http.StatusAccepted, map[string]interface{}{
		"pipeline_id": status.PipelineID, "pipeline_status": status.Status,
		"generation": status.Generation, "pipeline_started": status.Started,
	})
}
