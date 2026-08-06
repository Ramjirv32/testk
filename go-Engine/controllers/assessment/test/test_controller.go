package testctrl

import (
	"encoding/json"
	"fmt"
	"gobackend/models"
		authsvc "gobackend/services/auth"
	assessmentsvc "gobackend/services/assessment"
	"gobackend/utils"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func GetTestQuestions(w http.ResponseWriter, r *http.Request) {
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

	var testType models.TestType
	var questions []models.TestQuestion

	if user.Age >= 18 {

		testType = models.MVTITest
		questions = assessmentsvc.GetMVTIQuestions()
	} else {

		testType = models.CognitiveTest
		questions = assessmentsvc.GetCognitiveQuestions()
	}

	completed, err := assessmentsvc.CheckTestCompletion(userID, testType)
	if err == nil && completed {
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error":     "Test already completed",
			"test_type": string(testType),
			"message":   "You have already completed this test. You cannot retake it.",
		})
		return
	}

	var questionsForClient []map[string]interface{}
	for _, q := range questions {
		questionsForClient = append(questionsForClient, map[string]interface{}{
			"question_id": q.QuestionID,
			"question":    q.Question,
			"options":     q.Options,
		})
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"test_type": testType,
		"age":       user.Age,
		"questions": questionsForClient,
	})
}

func SubmitTest(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Unauthorized",
		})
		return
	}

	var req models.SubmitTestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
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

	var expectedTestType models.TestType
	if user.Age >= 18 {
		expectedTestType = models.MVTITest
	} else {
		expectedTestType = models.CognitiveTest
	}

	var testType models.TestType
	if req.TestType == "mvti" {
		testType = models.MVTITest
	} else if req.TestType == "cognitive" {
		testType = models.CognitiveTest
	} else {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid test type",
		})
		return
	}

	if testType != expectedTestType {
		log.Printf(" SECURITY: User %s (age %d) attempted to submit wrong test type: %s (expected: %s)", userID, user.Age, testType, expectedTestType)
		utils.RespondJSON(w, http.StatusForbidden, map[string]string{
			"error":    "You are not eligible for this test type",
			"message":  fmt.Sprintf("Based on your age (%d), you should take the %s test", user.Age, expectedTestType),
			"expected": string(expectedTestType),
		})
		return
	}

	completed, err := assessmentsvc.CheckTestCompletion(userID, testType)
	if err == nil && completed {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Test already completed",
		})
		return
	}

	var answers []struct {
		QuestionID     int `json:"question_id"`
		SelectedOption int `json:"selected_option"`
	}
	for _, a := range req.Answers {
		answers = append(answers, struct {
			QuestionID     int `json:"question_id"`
			SelectedOption int `json:"selected_option"`
		}{
			QuestionID:     a.QuestionID,
			SelectedOption: a.SelectedOption,
		})
	}

	interactions := make(map[int]models.QuestionInteraction)
	for key, value := range req.QuestionInteractions {
		var questionID int
		fmt.Sscanf(key, "%d", &questionID)
		interactions[questionID] = value
	}

	result, err := assessmentsvc.SubmitTest(userID, user.Email, testType, user.Age, user.StudentType, answers, interactions, req.TotalTimeSpent)
	if err != nil {
		log.Printf(" Test submission error: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to submit test",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"message":     "Test submitted successfully",
		"result":      result,
		"total_score": result.TotalScore,
		"max_score":   result.MaxScore,
		"percentage":  result.Percentage,
	})
}

func GetUserTestStatus(w http.ResponseWriter, r *http.Request) {
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

	var testType models.TestType
	if user.Age >= 18 {

		testType = models.MVTITest
	} else {

		testType = models.CognitiveTest
	}

	completed, _ := assessmentsvc.CheckTestCompletion(userID, testType)

	var result *models.TestResult
	if completed {
		result, _ = assessmentsvc.GetUserTestResult(userID, testType)
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"test_type": testType,
		"age":       user.Age,
		"completed": completed,
		"result":    result,
	})
}

func GetAllTestResults(w http.ResponseWriter, r *http.Request) {
	testTypeParam := r.URL.Query().Get("test_type")

	var testType models.TestType
	if testTypeParam == "mvti" {
		testType = models.MVTITest
	} else if testTypeParam == "cognitive" {
		testType = models.CognitiveTest
	} else {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid test type. Use 'mvti' or 'cognitive'",
		})
		return
	}

	results, err := assessmentsvc.GetAllTestResults(testType)
	if err != nil {
		log.Printf(" Error fetching test results: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to fetch test results",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"test_type": testType,
		"count":     len(results),
		"results":   results,
	})
}

func GetUserTestResults(w http.ResponseWriter, r *http.Request) {
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

	var allResults []models.TestResult

	mvtiResult, err := assessmentsvc.GetUserTestResult(userID, models.MVTITest)
	if err == nil && mvtiResult != nil {
		allResults = append(allResults, *mvtiResult)
	}

	cognitiveResult, err := assessmentsvc.GetUserTestResult(userID, models.CognitiveTest)
	if err == nil && cognitiveResult != nil {
		allResults = append(allResults, *cognitiveResult)
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"user_id": userID,
		"email":   user.Email,
		"count":   len(allResults),
		"results": allResults,
	})
}

func GetTestResultByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	resultID := vars["id"]

	testTypeParam := r.URL.Query().Get("test_type")
	var testType models.TestType
	if testTypeParam == "mvti" {
		testType = models.MVTITest
	} else if testTypeParam == "cognitive" {
		testType = models.CognitiveTest
	} else {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid test type. Use 'mvti' or 'cognitive'",
		})
		return
	}

	result, err := assessmentsvc.GetTestResultByID(resultID, testType)
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
