package routes

import (
	"gobackend/controllers/assessment/behavioral"
	"gobackend/controllers/assessment/cognitive"
	"gobackend/controllers/assessment/mbti"
	"gobackend/controllers/assessment/pescio"
	"gobackend/controllers/assessment/psychometric"
	testctrl "gobackend/controllers/assessment/test"
	"gobackend/middleware"

	"github.com/gorilla/mux"
)

func setupAssessmentRoutes(r *mux.Router) {
	testRouter := r.PathPrefix("/api/test").Subrouter()
	testRouter.Use(middleware.AuthMiddleware)
	testRouter.HandleFunc("/questions", testctrl.GetTestQuestions).Methods("GET", "OPTIONS")
	testRouter.HandleFunc("/submit", testctrl.SubmitTest).Methods("POST", "OPTIONS")
	testRouter.HandleFunc("/status", testctrl.GetUserTestStatus).Methods("GET", "OPTIONS")
	testRouter.HandleFunc("/user-results", testctrl.GetUserTestResults).Methods("GET", "OPTIONS")

	psychoRouter := r.PathPrefix("/api/psychometric").Subrouter()
	psychoRouter.Use(middleware.AuthMiddleware)
	psychoRouter.HandleFunc("/register", psychometric.RegisterForPsychometricTest).Methods("POST", "OPTIONS")
	psychoRouter.HandleFunc("/registration", psychometric.GetPsychometricRegistration).Methods("GET", "OPTIONS")
	psychoRouter.HandleFunc("/questions", psychometric.GetPsychometricQuestions).Methods("GET", "OPTIONS")
	psychoRouter.HandleFunc("/submit", psychometric.SubmitPsychometricTest).Methods("POST", "OPTIONS")
	psychoRouter.HandleFunc("/result", psychometric.GetPsychometricResult).Methods("GET", "OPTIONS")

	mbtiRouter := r.PathPrefix("/api/mbti").Subrouter()
	mbtiRouter.Use(middleware.AuthMiddleware)
	mbtiRouter.HandleFunc("/register", mbti.RegisterForMBTITest).Methods("POST", "OPTIONS")
	mbtiRouter.HandleFunc("/registration", mbti.GetMBTIRegistration).Methods("GET", "OPTIONS")
	mbtiRouter.HandleFunc("/questions", mbti.GetMBTIQuestions).Methods("GET", "OPTIONS")
	mbtiRouter.HandleFunc("/submit", mbti.SubmitMBTITest).Methods("POST", "OPTIONS")
	mbtiRouter.HandleFunc("/result", mbti.GetMBTIResult).Methods("GET", "OPTIONS")

	cognitiveRouter := r.PathPrefix("/api/cognitive").Subrouter()
	cognitiveRouter.Use(middleware.AuthMiddleware)
	cognitiveRouter.HandleFunc("/register", cognitive.RegisterForCognitiveTest).Methods("POST", "OPTIONS")
	cognitiveRouter.HandleFunc("/registration", cognitive.GetCognitiveRegistration).Methods("GET", "OPTIONS")
	cognitiveRouter.HandleFunc("/questions", cognitive.GetCognitiveQuestions).Methods("GET", "OPTIONS")
	cognitiveRouter.HandleFunc("/submit", cognitive.SubmitCognitiveTest).Methods("POST", "OPTIONS")
	cognitiveRouter.HandleFunc("/result", cognitive.GetCognitiveResult).Methods("GET", "OPTIONS")

	pescioRouter := r.PathPrefix("/api/pescio").Subrouter()
	pescioRouter.Use(middleware.AuthMiddleware)
	pescioRouter.HandleFunc("/register", pescio.RegisterForPESCIOTest).Methods("POST", "OPTIONS")
	pescioRouter.HandleFunc("/registration", pescio.GetPESCIORegistration).Methods("GET", "OPTIONS")
	pescioRouter.HandleFunc("/questions", pescio.GetPESCIOQuestions).Methods("GET", "OPTIONS")
	pescioRouter.HandleFunc("/submit", pescio.SubmitPESCIOTest).Methods("POST", "OPTIONS")
	pescioRouter.HandleFunc("/result", pescio.GetPESCIOResult).Methods("GET", "OPTIONS")

	behavioralRouter := r.PathPrefix("/api/behavioral").Subrouter()
	behavioralRouter.Use(middleware.AuthMiddleware)
	behavioralRouter.HandleFunc("/register", behavioral.RegisterForBehavioralTest).Methods("POST", "OPTIONS")
	behavioralRouter.HandleFunc("/registration", behavioral.GetBehavioralRegistration).Methods("GET", "OPTIONS")
	behavioralRouter.HandleFunc("/questions", behavioral.GetBehavioralQuestions).Methods("GET", "OPTIONS")
	behavioralRouter.HandleFunc("/submit", behavioral.SubmitBehavioralTest).Methods("POST", "OPTIONS")
	behavioralRouter.HandleFunc("/result", behavioral.GetBehavioralResult).Methods("GET", "OPTIONS")
}
