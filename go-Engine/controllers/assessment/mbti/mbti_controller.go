package mbti

import (
	"encoding/json"
	"gobackend/models"
		authsvc "gobackend/services/auth"
	assessmentsvc "gobackend/services/assessment"
	"gobackend/utils"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func RegisterForMBTITest(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	user, err := authsvc.GetUserByID(userID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, map[string]string{
			"error": "User not found",
		})
		return
	}

	if user.Age < 18 {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "You must be 18 years or older to take the MBTI test",
		})
		return
	}

	var req models.MBTITestRegistrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	mbtiService := assessmentsvc.NewMBTIService()
	err = mbtiService.RegisterForTest(userID, user.Email, req)
	if err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "Registration submitted successfully. Please wait for admin approval.",
	})
}

func GetMBTIRegistration(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	mbtiService := assessmentsvc.NewMBTIService()
	registration, err := mbtiService.GetUserRegistration(userID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, map[string]string{
			"error": "No registration found",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"registration": registration,
	})
}

func GetMBTIQuestions(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	mbtiService := assessmentsvc.NewMBTIService()

	registration, err := mbtiService.GetUserRegistration(userID)
	if err != nil || registration.Status != "approved" {
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error": "You must have an approved registration to access the test",
		})
		return
	}

	questions := mbtiService.GetMBTIQuestions()
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"questions": questions,
	})
}

func SubmitMBTITest(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	user, err := authsvc.GetUserByID(userID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, map[string]string{
			"error": "User not found",
		})
		return
	}

	var req models.MBTITestSubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	req.UserID = userID

	mbtiService := assessmentsvc.NewMBTIService()
	result, err := mbtiService.SubmitTest(userID, user.Email, req)
	if err != nil {
		log.Printf(" MBTI test submission error: %v", err)
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Test submitted successfully",
		"result":  result,
	})
}

func GetMBTIResult(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	mbtiService := assessmentsvc.NewMBTIService()
	result, err := mbtiService.GetUserResult(userID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, map[string]string{
			"error": "No result found",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"result": result,
	})
}

func GetAllMBTIRegistrations(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	mbtiService := assessmentsvc.NewMBTIService()
	registrations, err := mbtiService.GetAllRegistrations(status)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to fetch registrations",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"registrations": registrations,
		"count":         len(registrations),
	})
}

func ApproveMBTIRegistration(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	registrationID := vars["id"]

	email := r.Header.Get("X-User-Email")
	if email == "" {
		email = "admin"
	}

	mbtiService := assessmentsvc.NewMBTIService()
	err := mbtiService.ApproveRegistration(registrationID, email)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "Registration approved successfully",
	})
}

func RejectMBTIRegistration(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	registrationID := vars["id"]

	var req struct {
		Reason string `json:"reason"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	if req.Reason == "" {
		req.Reason = "Not specified"
	}

	mbtiService := assessmentsvc.NewMBTIService()
	err := mbtiService.RejectRegistration(registrationID, req.Reason)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "Registration rejected successfully",
	})
}

func GetAllMBTIResults(w http.ResponseWriter, r *http.Request) {
	mbtiService := assessmentsvc.NewMBTIService()
	results, err := mbtiService.GetAllResults()
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"results": results,
		"count":   len(results),
	})
}

func GetMBTIResultByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	resultID := vars["id"]

	mbtiService := assessmentsvc.NewMBTIService()
	result, err := mbtiService.GetResultByID(resultID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"result": result,
	})
}
