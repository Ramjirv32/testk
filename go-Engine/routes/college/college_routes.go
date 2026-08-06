package college

import (
	"gobackend/controllers/college"

	"github.com/gorilla/mux"
)

func RegisterCollegeRoutes(r *mux.Router) {
	// Base Stats & Info
	r.HandleFunc("/api/college-statistics", college.GetCollegeStatistics).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/countries", college.GetCountries).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/colleges-by-country", college.GetCollegesByCountry).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/ingest/college", college.IngestCollege).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/ingest/section", college.IngestSection).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/ingest/complete", college.IngestComplete).Methods("POST", "OPTIONS")

	// College Validation (Groq-based)
	r.HandleFunc("/api/college/validate", college.ValidateCollegeName).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/college/check-or-start", college.CheckOrStart).Methods("POST", "OPTIONS")

	// Search
	r.HandleFunc("/api/search", college.SearchUniversity).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/all-colleges", college.GetAllColleges).Methods("GET", "OPTIONS")

	// Academic Orchestrator
	r.HandleFunc("/api/college/orchestrate", college.OrchestrateCollege).Methods("GET", "OPTIONS")

	// Analytics
	r.HandleFunc("/api/most-searched", college.GetMostSearchedColleges).Methods("GET", "OPTIONS")

	// System health
	r.HandleFunc("/api/health", college.HealthCheck).Methods("GET", "OPTIONS")
}
