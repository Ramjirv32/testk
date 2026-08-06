package adminroutes

import (
	"gobackend/controllers/assessment/behavioral"
	"gobackend/controllers/assessment/cognitive"
	"gobackend/controllers/assessment/mbti"
	"gobackend/controllers/assessment/pescio"
	"gobackend/controllers/assessment/psychometric"
	testctrl "gobackend/controllers/assessment/test"

	"github.com/gorilla/mux"
)

func RegisterAssessmentRoutes(adminRouter *mux.Router) {
	adminRouter.HandleFunc("/test-results", testctrl.GetAllTestResults).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/test-result/{id}", testctrl.GetTestResultByID).Methods("GET", "OPTIONS")

	adminRouter.HandleFunc("/psychometric/registrations", psychometric.GetAllPsychometricRegistrations).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/psychometric/approve/{id}", psychometric.ApprovePsychometricRegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/psychometric/reject/{id}", psychometric.RejectPsychometricRegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/psychometric/results", psychometric.GetAllPsychometricResults).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/psychometric/result/{id}", psychometric.GetPsychometricResultDetail).Methods("GET", "OPTIONS")

	adminRouter.HandleFunc("/mbti/registrations", mbti.GetAllMBTIRegistrations).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/mbti/approve/{id}", mbti.ApproveMBTIRegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/mbti/reject/{id}", mbti.RejectMBTIRegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/mbti/results", mbti.GetAllMBTIResults).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/mbti/result/{id}", mbti.GetMBTIResultByID).Methods("GET", "OPTIONS")

	adminRouter.HandleFunc("/cognitive/registrations", cognitive.GetAllCognitiveRegistrations).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/cognitive/approve/{id}", cognitive.ApproveCognitiveRegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/cognitive/reject/{id}", cognitive.RejectCognitiveRegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/cognitive/results", cognitive.GetAllCognitiveResults).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/cognitive/result/{id}", cognitive.GetCognitiveResultDetail).Methods("GET", "OPTIONS")

	adminRouter.HandleFunc("/pescio/registrations", pescio.GetAllPESCIORegistrations).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/pescio/approve/{id}", pescio.ApprovePESCIORegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/pescio/reject/{id}", pescio.RejectPESCIORegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/pescio/results", pescio.GetAllPESCIOResults).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/pescio/result/{id}", pescio.GetPESCIOResultByID).Methods("GET", "OPTIONS")

	adminRouter.HandleFunc("/behavioral/registrations", behavioral.GetAllBehavioralRegistrations).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/behavioral/approve/{id}", behavioral.ApproveBehavioralRegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/behavioral/reject/{id}", behavioral.RejectBehavioralRegistration).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/behavioral/results", behavioral.GetAllBehavioralResults).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/behavioral/result/{id}", behavioral.GetBehavioralResultDetail).Methods("GET", "OPTIONS")
}
