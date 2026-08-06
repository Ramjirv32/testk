package models

import "time"

type User struct {
	ID                string    `json:"id" bson:"_id,omitempty"`
	Name              string    `json:"name" bson:"name"`
	Email             string    `json:"email" bson:"email"`
	Password          string    `json:"-" bson:"password"`
	Role              string    `json:"role" bson:"role"`
	DateOfBirth       time.Time `json:"date_of_birth" bson:"date_of_birth"`
	Age               int       `json:"age" bson:"age"`
	StudentType       string    `json:"student_type" bson:"student_type"`
	IsVerified        bool      `json:"is_verified" bson:"is_verified"`
	VerificationToken string    `json:"-" bson:"verification_token"`
	ResetToken        string    `json:"-" bson:"reset_token"`
	ResetTokenExpiry  time.Time `json:"-" bson:"reset_token_expiry"`
	CreatedAt         time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" bson:"updated_at"`
	LastLogin         time.Time `json:"last_login" bson:"last_login"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type SignupRequest struct {
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	DateOfBirth string `json:"date_of_birth" binding:"required"`
}

type StudentDetails struct {
	ID          string    `json:"id" bson:"_id,omitempty"`
	UserID      string    `json:"user_id" bson:"user_id"`
	Email       string    `json:"email" bson:"email"`
	DateOfBirth time.Time `json:"date_of_birth" bson:"date_of_birth"`
	Age         int       `json:"age" bson:"age"`
	StudentType string    `json:"student_type" bson:"student_type"`
	CreatedAt   time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" bson:"updated_at"`
}

type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
