package pescio

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

func RegisterForPESCIOTest(w http.ResponseWriter, r *http.Request) {
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

	pescioService := assessmentsvc.NewPESCIOService()
	err = pescioService.RegisterForTest(userID, user.Email)
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

func GetPESCIORegistration(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	pescioService := assessmentsvc.NewPESCIOService()
	registration, err := pescioService.GetUserRegistration(userID)
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

func GetPESCIOQuestions(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	pescioService := assessmentsvc.NewPESCIOService()

	registration, err := pescioService.GetUserRegistration(userID)
	if err != nil || registration.Status != "approved" {
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error": "You must have an approved registration to access the test",
		})
		return
	}

	questions := pescioService.GetPESCIOQuestions()
	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"questions": questions,
	})
}

func SubmitPESCIOTest(w http.ResponseWriter, r *http.Request) {
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

	var req models.PescioTestSubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	req.UserID = userID

	pescioService := assessmentsvc.NewPESCIOService()
	result, err := pescioService.SubmitTest(userID, user.Email, req)
	if err != nil {
		log.Printf(" PESCIO test submission error: %v", err)
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

func GetPESCIOResult(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	pescioService := assessmentsvc.NewPESCIOService()
	result, err := pescioService.GetUserResult(userID)
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

func GetAllPESCIORegistrations(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")

	pescioService := assessmentsvc.NewPESCIOService()
	registrations, err := pescioService.GetAllRegistrations(status)
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

func ApprovePESCIORegistration(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	registrationID := vars["id"]

	email := r.Header.Get("X-User-Email")
	if email == "" {
		email = "admin"
	}

	pescioService := assessmentsvc.NewPESCIOService()
	err := pescioService.ApproveRegistration(registrationID, email)
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

func RejectPESCIORegistration(w http.ResponseWriter, r *http.Request) {
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

	pescioService := assessmentsvc.NewPESCIOService()
	err := pescioService.RejectRegistration(registrationID, req.Reason)
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

func GetAllPESCIOResults(w http.ResponseWriter, r *http.Request) {
	pescioService := assessmentsvc.NewPESCIOService()
	results, err := pescioService.GetAllResults()
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

func GetPESCIOResultByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	resultID := vars["id"]

	if resultID == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Result ID is required",
		})
		return
	}

	pescioService := assessmentsvc.NewPESCIOService()
	result, err := pescioService.GetResultByID(resultID)
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
