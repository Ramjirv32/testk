package models

import "time"

type PescioTestRegistration struct {
	ID          string    `json:"id" bson:"_id,omitempty"`
	UserID      string    `json:"user_id" bson:"user_id"`
	Email       string    `json:"email" bson:"email"`
	Name        string    `json:"name" bson:"name"`
	Age         int       `json:"age" bson:"age"`
	StudentType string    `json:"student_type" bson:"student_type"`
	Status      string    `json:"status" bson:"status"`
	Reason      string    `json:"reason,omitempty" bson:"reason,omitempty"`
	CreatedAt   time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" bson:"updated_at"`
	ApprovedAt  time.Time `json:"approved_at,omitempty" bson:"approved_at,omitempty"`
	ApprovedBy  string    `json:"approved_by,omitempty" bson:"approved_by,omitempty"`
}

type PescioTestQuestion struct {
	QuestionID int      `json:"question_id" bson:"question_id"`
	Question   string   `json:"question" bson:"question"`
	Options    []string `json:"options" bson:"options"`
}

type PescioTestAnswer struct {
	QuestionID     int    `json:"question_id" bson:"question_id"`
	Question       string `json:"question" bson:"question"`
	SelectedOption int    `json:"selected_option" bson:"selected_option"`
	Score          int    `json:"score" bson:"score"`
}

type PescioTestResult struct {
	ID          string             `json:"id" bson:"_id,omitempty"`
	UserID      string             `json:"user_id" bson:"user_id"`
	Email       string             `json:"email" bson:"email"`
	Name        string             `json:"name" bson:"name"`
	Age         int                `json:"age" bson:"age"`
	StudentType string             `json:"student_type" bson:"student_type"`
	Answers     []PescioTestAnswer `json:"answers" bson:"answers"`
	TotalScore  int                `json:"total_score" bson:"total_score"`
	MaxScore    int                `json:"max_score" bson:"max_score"`
	Percentage  float64            `json:"percentage" bson:"percentage"`

	PracticalScore      int       `json:"practical_score" bson:"practical_score"`
	EnterprisingScore   int       `json:"enterprising_score" bson:"enterprising_score"`
	SocialScore         int       `json:"social_score" bson:"social_score"`
	CreativeScore       int       `json:"creative_score" bson:"creative_score"`
	InvestigativeScore  int       `json:"investigative_score" bson:"investigative_score"`
	OrganisationalScore int       `json:"organisational_score" bson:"organisational_score"`
	TopCategory         string    `json:"top_category" bson:"top_category"`
	Interpretation      string    `json:"interpretation" bson:"interpretation"`
	TotalTimeSpent      int       `json:"total_time_spent" bson:"total_time_spent"`
	IsCompleted         bool      `json:"is_completed" bson:"is_completed"`
	CompletedAt         time.Time `json:"completed_at" bson:"completed_at"`
	CreatedAt           time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" bson:"updated_at"`
}

type PescioTestSubmitRequest struct {
	UserID         string `json:"user_id" binding:"required"`
	TotalTimeSpent int    `json:"total_time_spent"`
	Answers        []struct {
		QuestionID     int `json:"question_id" binding:"required"`
		SelectedOption int `json:"selected_option" binding:"required"`
	} `json:"answers" binding:"required"`
}

type PescioTestRegistrationRequest struct {
}
