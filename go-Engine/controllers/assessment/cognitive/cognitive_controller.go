package cognitive

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

func RegisterForCognitiveTest(w http.ResponseWriter, r *http.Request) {
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

	if user.Age >= 18 {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "You must be under 18 years old to take the Cognitive test",
		})
		return
	}

	var req models.CognitiveTestRegistrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	cognitiveService := assessmentsvc.NewCognitiveService()
	err = cognitiveService.RegisterForTest(userID, user.Email, req)
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

func GetCognitiveRegistration(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	cognitiveService := assessmentsvc.NewCognitiveService()
	registration, err := cognitiveService.GetUserRegistration(userID)
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

func GetCognitiveQuestions(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	cognitiveService := assessmentsvc.NewCognitiveService()

	registration, err := cognitiveService.GetUserRegistration(userID)
	if err != nil || registration.Status != "approved" {
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error": "You must have an approved registration to access the test",
		})
		return
	}

	questions := cognitiveService.GetCognitiveQuestions()
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"questions": questions,
	})
}

func SubmitCognitiveTest(w http.ResponseWriter, r *http.Request) {
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

	var req models.CognitiveTestSubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	req.UserID = userID

	cognitiveService := assessmentsvc.NewCognitiveService()
	result, err := cognitiveService.SubmitTest(userID, user.Email, req)
	if err != nil {
		log.Printf(" Cognitive test submission error: %v", err)
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

func GetCognitiveResult(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	cognitiveService := assessmentsvc.NewCognitiveService()
	result, err := cognitiveService.GetUserResult(userID)
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

func GetAllCognitiveRegistrations(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	cognitiveService := assessmentsvc.NewCognitiveService()
	registrations, err := cognitiveService.GetAllRegistrations(status)
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

func ApproveCognitiveRegistration(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	registrationID := vars["id"]

	email := r.Header.Get("X-User-Email")
	if email == "" {
		email = "admin"
	}

	cognitiveService := assessmentsvc.NewCognitiveService()
	err := cognitiveService.ApproveRegistration(registrationID, email)
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

func RejectCognitiveRegistration(w http.ResponseWriter, r *http.Request) {
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

	cognitiveService := assessmentsvc.NewCognitiveService()
	err := cognitiveService.RejectRegistration(registrationID, req.Reason)
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

func GetAllCognitiveResults(w http.ResponseWriter, r *http.Request) {
	cognitiveService := assessmentsvc.NewCognitiveService()
	results, err := cognitiveService.GetAllResults()
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

func GetCognitiveResultDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	resultID := vars["id"]

	cognitiveService := assessmentsvc.NewCognitiveService()
	result, err := cognitiveService.GetResultByID(resultID)
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
