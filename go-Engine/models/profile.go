package models

import "time"

type StudentProfile struct {
	ID               string    `json:"id" bson:"_id,omitempty"`
	UserID           string    `json:"user_id" bson:"user_id"`
	Email            string    `json:"email" bson:"email"`
	FullName         string    `json:"full_name" bson:"full_name"`
	DateOfBirth      time.Time `json:"date_of_birth" bson:"date_of_birth"`
	Age              int       `json:"age" bson:"age"`
	Gender           string    `json:"gender" bson:"gender"`
	PhoneNumber      string    `json:"phone_number" bson:"phone_number"`
	Address          string    `json:"address" bson:"address"`
	City             string    `json:"city" bson:"city"`
	State            string    `json:"state" bson:"state"`
	Country          string    `json:"country" bson:"country"`
	PostalCode       string    `json:"postal_code" bson:"postal_code"`
	SchoolName       string    `json:"school_name" bson:"school_name"`
	Grade            string    `json:"grade" bson:"grade"`
	StudentType      string    `json:"student_type" bson:"student_type"`
	ProfilePicture   string    `json:"profile_picture" bson:"profile_picture"`
	Bio              string    `json:"bio" bson:"bio"`
	Interests        []string  `json:"interests" bson:"interests"`
	Achievements     []string  `json:"achievements" bson:"achievements"`
	ParentName       string    `json:"parent_name" bson:"parent_name"`
	ParentEmail      string    `json:"parent_email" bson:"parent_email"`
	ParentPhone      string    `json:"parent_phone" bson:"parent_phone"`
	EmergencyContact string    `json:"emergency_contact" bson:"emergency_contact"`
	CreatedAt        time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" bson:"updated_at"`
}

type UpdateProfileRequest struct {
	FullName         string   `json:"full_name"`
	Gender           string   `json:"gender"`
	PhoneNumber      string   `json:"phone_number"`
	Address          string   `json:"address"`
	City             string   `json:"city"`
	State            string   `json:"state"`
	Country          string   `json:"country"`
	PostalCode       string   `json:"postal_code"`
	SchoolName       string   `json:"school_name"`
	Grade            string   `json:"grade"`
	Bio              string   `json:"bio"`
	Interests        []string `json:"interests"`
	Achievements     []string `json:"achievements"`
	ParentName       string   `json:"parent_name"`
	ParentEmail      string   `json:"parent_email"`
	ParentPhone      string   `json:"parent_phone"`
	EmergencyContact string   `json:"emergency_contact"`
}
