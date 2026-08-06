package models

import "time"

type MBTITestRegistration struct {
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

type MBTITestQuestion struct {
	QuestionID int      `json:"question_id" bson:"question_id"`
	Question   string   `json:"question" bson:"question"`
	Options    []string `json:"options" bson:"options"`
	Dimension  string   `json:"dimension,omitempty" bson:"dimension,omitempty"`
}

type MBTITestAnswer struct {
	QuestionID     int    `json:"question_id" bson:"question_id"`
	Question       string `json:"question" bson:"question"`
	SelectedOption int    `json:"selected_option" bson:"selected_option"`
	CorrectOption  int    `json:"correct_option" bson:"correct_option"`
	IsCorrect      bool   `json:"is_correct" bson:"is_correct"`
}

type MBTITestResult struct {
	ID          string           `json:"id" bson:"_id,omitempty"`
	UserID      string           `json:"user_id" bson:"user_id"`
	Email       string           `json:"email" bson:"email"`
	Name        string           `json:"name" bson:"name"`
	Age         int              `json:"age" bson:"age"`
	StudentType string           `json:"student_type" bson:"student_type"`
	MBTIType    string           `json:"mbti_type" bson:"mbti_type"`
	Answers     []MBTITestAnswer `json:"answers" bson:"answers"`
	TotalScore  int              `json:"total_score" bson:"total_score"`
	MaxScore    int              `json:"max_score" bson:"max_score"`
	Percentage  float64          `json:"percentage" bson:"percentage"`

	ExtroversionIntroversion int       `json:"extroversion_introversion" bson:"extroversion_introversion"`
	SensingIntuition         int       `json:"sensing_intuition" bson:"sensing_intuition"`
	ThinkingFeeling          int       `json:"thinking_feeling" bson:"thinking_feeling"`
	JudgingPerceiving        int       `json:"judging_perceiving" bson:"judging_perceiving"`
	Interpretation           string    `json:"interpretation" bson:"interpretation"`
	TotalTimeSpent           int       `json:"total_time_spent" bson:"total_time_spent"`
	IsCompleted              bool      `json:"is_completed" bson:"is_completed"`
	CompletedAt              time.Time `json:"completed_at" bson:"completed_at"`
	CreatedAt                time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt                time.Time `json:"updated_at" bson:"updated_at"`
}

type MBTITestSubmitRequest struct {
	UserID         string `json:"user_id" binding:"required"`
	TotalTimeSpent int    `json:"total_time_spent"`
	Answers        []struct {
		QuestionID     int `json:"question_id" binding:"required"`
		SelectedOption int `json:"selected_option" binding:"required"`
	} `json:"answers" binding:"required"`
}

type MBTITestRegistrationRequest struct {
}
