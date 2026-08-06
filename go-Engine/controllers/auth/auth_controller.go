package auth

import (
	"encoding/json"
	"log"
	"net/http"

	"gobackend/models"
	authsvc "gobackend/services/auth"
	"gobackend/utils"
)

var authService = authsvc.NewAuthService()

func Signup(w http.ResponseWriter, r *http.Request) {
	var req models.SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	if req.Name == "" || req.Email == "" || req.Password == "" || req.DateOfBirth == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Name, email, password, and date of birth are required",
		})
		return
	}

	if len(req.Password) < 6 {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Password must be at least 6 characters",
		})
		return
	}

	user, err := authService.Signup(req.Name, req.Email, req.Password, req.DateOfBirth)
	if err != nil {
		log.Printf(" Signup error: %v", err)
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "User created successfully. You can now login.",
		"user": map[string]interface{}{
			"id":           user.ID,
			"name":         user.Name,
			"email":        user.Email,
			"role":         user.Role,
			"age":          user.Age,
			"student_type": user.StudentType,
		},
	})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	user, token, err := authService.Login(req.Email, req.Password)
	if err != nil {
		log.Printf(" Login error for %s: %v", req.Email, err)
		utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Login successful",
		"token":   token,
		"user": map[string]interface{}{
			"id":           user.ID,
			"name":         user.Name,
			"email":        user.Email,
			"role":         user.Role,
			"age":          user.Age,
			"student_type": user.StudentType,
		},
	})
}

func VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Verification token required",
		})
		return
	}

	err := authService.VerifyEmail(token)
	if err != nil {
		log.Printf(" Email verification error: %v", err)
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "Email verified successfully. You can now login.",
	})
}

func ResendVerification(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	err := authService.ResendVerification(req.Email)
	if err != nil {
		log.Printf(" Resend verification error: %v", err)
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": err.Error(),
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "Verification email sent successfully",
	})
}

func GetCurrentUser(w http.ResponseWriter, r *http.Request) {
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

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"user": map[string]interface{}{
			"id":          user.ID,
			"name":        user.Name,
			"email":       user.Email,
			"role":        user.Role,
			"is_verified": user.IsVerified,
			"created_at":  user.CreatedAt,
			"last_login":  user.LastLogin,
		},
	})
}
