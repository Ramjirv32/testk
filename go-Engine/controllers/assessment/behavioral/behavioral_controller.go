package behavioral

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

func RegisterForBehavioralTest(w http.ResponseWriter, r *http.Request) {
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

	if user.Age > 15 {
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error": "This test is only available for students aged 15 and below",
		})
		return
	}

	behavioralService := assessmentsvc.NewBehavioralTestService()
	err = behavioralService.RegisterForTest(userID, user.Email)
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

func GetBehavioralRegistration(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	behavioralService := assessmentsvc.NewBehavioralTestService()
	registration, err := behavioralService.GetUserRegistration(userID)
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

func GetBehavioralQuestions(w http.ResponseWriter, r *http.Request) {
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

	if user.Age > 15 {
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error": "This test is only available for students aged 15 and below",
		})
		return
	}

	behavioralService := assessmentsvc.NewBehavioralTestService()

	registration, err := behavioralService.GetUserRegistration(userID)
	if err != nil || registration.Status != "approved" {
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error": "You must have an approved registration to access the test",
		})
		return
	}

	questions := behavioralService.GetBehavioralQuestions()
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"questions": questions,
	})
}

func SubmitBehavioralTest(w http.ResponseWriter, r *http.Request) {
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

	if user.Age > 15 {
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error": "This test is only available for students aged 15 and below",
		})
		return
	}

	var req models.BehavioralSubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	req.UserID = userID

	behavioralService := assessmentsvc.NewBehavioralTestService()
	result, err := behavioralService.SubmitTest(userID, user.Email, req)
	if err != nil {
		log.Printf(" Behavioral test submission error: %v", err)
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

func GetBehavioralResult(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	behavioralService := assessmentsvc.NewBehavioralTestService()
	result, err := behavioralService.GetUserResult(userID)
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

func GetAllBehavioralRegistrations(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	behavioralService := assessmentsvc.NewBehavioralTestService()
	registrations, err := behavioralService.GetAllRegistrations(status)
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

func ApproveBehavioralRegistration(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	registrationID := vars["id"]

	email := r.Header.Get("X-User-Email")
	if email == "" {
		email = "admin"
	}

	behavioralService := assessmentsvc.NewBehavioralTestService()
	err := behavioralService.ApproveRegistration(registrationID, email)
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

func RejectBehavioralRegistration(w http.ResponseWriter, r *http.Request) {
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

	behavioralService := assessmentsvc.NewBehavioralTestService()
	err := behavioralService.RejectRegistration(registrationID, req.Reason)
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

func GetAllBehavioralResults(w http.ResponseWriter, r *http.Request) {
	behavioralService := assessmentsvc.NewBehavioralTestService()
	results, err := behavioralService.GetAllResults()
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

func GetBehavioralResultDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	resultID := vars["id"]

	behavioralService := assessmentsvc.NewBehavioralTestService()
	result, err := behavioralService.GetResultByID(resultID)
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
