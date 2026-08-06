package psychometric

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

func RegisterForPsychometricTest(w http.ResponseWriter, r *http.Request) {
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

	var req models.PsychometricRegistrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	psychoService := assessmentsvc.NewPsychometricService()
	err = psychoService.RegisterForTest(userID, user.Email, req)
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

func GetPsychometricRegistration(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	psychoService := assessmentsvc.NewPsychometricService()
	registration, err := psychoService.GetUserRegistration(userID)
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

func GetPsychometricQuestions(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	psychoService := assessmentsvc.NewPsychometricService()

	registration, err := psychoService.GetUserRegistration(userID)
	if err != nil || registration.Status != "approved" {
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error": "You must have an approved registration to access the test",
		})
		return
	}

	questions := psychoService.GetPsychometricQuestions()
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"questions": questions,
	})
}

func SubmitPsychometricTest(w http.ResponseWriter, r *http.Request) {
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

	var req models.PsychometricSubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	req.UserID = userID

	psychoService := assessmentsvc.NewPsychometricService()
	result, err := psychoService.SubmitTest(userID, user.Email, req)
	if err != nil {
		log.Printf(" Psychometric test submission error: %v", err)
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

func GetPsychometricResult(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	psychoService := assessmentsvc.NewPsychometricService()
	result, err := psychoService.GetUserResult(userID)
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

func GetAllPsychometricRegistrations(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	psychoService := assessmentsvc.NewPsychometricService()
	registrations, err := psychoService.GetAllRegistrations(status)
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

func ApprovePsychometricRegistration(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	registrationID := vars["id"]

	email := r.Header.Get("X-User-Email")
	if email == "" {
		email = "admin"
	}

	psychoService := assessmentsvc.NewPsychometricService()
	err := psychoService.ApproveRegistration(registrationID, email)
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

func RejectPsychometricRegistration(w http.ResponseWriter, r *http.Request) {
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

	psychoService := assessmentsvc.NewPsychometricService()
	err := psychoService.RejectRegistration(registrationID, req.Reason)
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

func GetAllPsychometricResults(w http.ResponseWriter, r *http.Request) {
	psychoService := assessmentsvc.NewPsychometricService()
	results, err := psychoService.GetAllResults()
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

func GetPsychometricResultDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	resultID := vars["id"]

	psychoService := assessmentsvc.NewPsychometricService()
	result, err := psychoService.GetResultByID(resultID)
	if err != nil {
		utils.RespondJSON(w, http.StatusNotFound, map[string]string{
			"error": "Result not found",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"result": result,
	})
}
