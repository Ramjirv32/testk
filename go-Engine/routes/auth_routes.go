package routes

import (
	"net/http"

	"gobackend/controllers/auth"
	"gobackend/controllers/college"
	"gobackend/controllers/page"
	"gobackend/middleware"

	"github.com/gorilla/mux"
)

func setupBaseRoutes(r *mux.Router) {
	r.HandleFunc("/api/health", college.HealthCheck).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/version", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"version":"deploy-2025-12-20-01"}`))
	}).Methods("GET", "OPTIONS")
	r.HandleFunc("/check/automate", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"automated","message":"System is automated and running"}`))
	}).Methods("GET", "OPTIONS")
	r.HandleFunc("/", page.HomePage).Methods("GET", "OPTIONS")
	r.HandleFunc("/college-statistics", page.CollegeStatsPage).Methods("GET", "OPTIONS")
}

func setupAuthRoutes(r *mux.Router) {
	r.HandleFunc("/api/auth/signup", auth.Signup).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/auth/login", auth.Login).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/auth/verify-email", auth.VerifyEmail).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/auth/resend-verification", auth.ResendVerification).Methods("POST", "OPTIONS")

	authRouter := r.PathPrefix("/api/auth").Subrouter()
	authRouter.Use(middleware.AuthMiddleware)
	authRouter.HandleFunc("/me", auth.GetCurrentUser).Methods("GET", "OPTIONS")
}
