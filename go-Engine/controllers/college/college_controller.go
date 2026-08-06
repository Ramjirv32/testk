package college

import (
	"encoding/json"
	"gobackend/services/cache"
	collegeService "gobackend/services/college"
	"net/http"
)

var redisService = cache.NewRedisService()

// ValidateCollegeName handles college name validation via Groq
// POST /api/college/validate
func ValidateCollegeName(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req collegeService.CollegeValidationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate college name
	resp := collegeService.ValidateCollegeName(req)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
