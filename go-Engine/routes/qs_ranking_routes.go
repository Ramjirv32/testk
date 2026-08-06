package routes

import (
	qsrankingcontroller "gobackend/controllers/qsranking"

	"github.com/gorilla/mux"
)

func setupQSRankingRoutes(r *mux.Router) {
	r.HandleFunc("/api/qs-rankings", qsrankingcontroller.List).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/qs-rankings/config", qsrankingcontroller.GetConfig).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/qs-rankings/config", qsrankingcontroller.UpdateConfig).Methods("PUT", "OPTIONS")
	r.HandleFunc("/api/qs-rankings/run", qsrankingcontroller.Run).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/qs-rankings/status", qsrankingcontroller.Status).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/qs-rankings/abort", qsrankingcontroller.Abort).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/qs-rankings/schedule", qsrankingcontroller.Schedule).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/qs-rankings/import", qsrankingcontroller.Import).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/qs-rankings/profile", qsrankingcontroller.IngestProfile).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/qs-profile", qsrankingcontroller.Profile).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/qs-profile/run", qsrankingcontroller.RunProfile).Methods("POST", "OPTIONS")
	r.HandleFunc("/ws/qs-profile", qsrankingcontroller.ProfileSocket)
	r.HandleFunc("/api/qs-load", qsrankingcontroller.Run).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/all-universities", qsrankingcontroller.DirectoryList).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/all-universities/config", qsrankingcontroller.DirectoryConfig).Methods("GET", "PUT", "OPTIONS")
	r.HandleFunc("/api/all-universities/run", qsrankingcontroller.DirectoryRun).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/all-universities/status", qsrankingcontroller.DirectoryStatus).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/all-universities/abort", qsrankingcontroller.DirectoryAbort).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/all-universities/schedule", qsrankingcontroller.DirectorySchedule).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/all-universities/import", qsrankingcontroller.DirectoryImport).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/all-universities-load", qsrankingcontroller.DirectoryRun).Methods("POST", "OPTIONS")
}
