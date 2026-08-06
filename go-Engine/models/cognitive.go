package models

import "time"

type CognitiveTestRegistration struct {
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

type CognitiveTestQuestion struct {
	QuestionID    int      `json:"question_id" bson:"question_id"`
	Question       string   `json:"question" bson:"question"`
	Options        []string `json:"options" bson:"options"`
	Category       string   `json:"category,omitempty" bson:"category,omitempty"`
	CorrectAnswer  int      `json:"correct_answer,omitempty" bson:"correct_answer,omitempty"`
}

type CognitiveTestAnswer struct {
	QuestionID     int    `json:"question_id" bson:"question_id"`
	Question       string `json:"question" bson:"question"`
	SelectedOption int    `json:"selected_option" bson:"selected_option"`
	CorrectOption  int    `json:"correct_option" bson:"correct_option"`
	IsCorrect      bool   `json:"is_correct" bson:"is_correct"`
}

type CognitiveTestResult struct {
	ID                  string                `json:"id" bson:"_id,omitempty"`
	UserID              string                `json:"user_id" bson:"user_id"`
	Email               string                `json:"email" bson:"email"`
	Name                string                `json:"name" bson:"name"`
	Age                 int                   `json:"age" bson:"age"`
	StudentType         string                `json:"student_type" bson:"student_type"`
	Answers             []CognitiveTestAnswer  `json:"answers" bson:"answers"`
	CorrectAnswers      int                   `json:"correct_answers,omitempty" bson:"correct_answers,omitempty"`
	TotalQuestions      int                   `json:"total_questions,omitempty" bson:"total_questions,omitempty"`
	TotalScore          int                   `json:"total_score" bson:"total_score"`
	MaxScore            int                   `json:"max_score" bson:"max_score"`
	Percentage          float64               `json:"percentage" bson:"percentage"`
	NumericalScore      int                   `json:"numerical_score,omitempty" bson:"numerical_score,omitempty"`
	NumericalPercentage int                   `json:"numerical_percentage,omitempty" bson:"numerical_percentage,omitempty"`
	VerbalScore         int                   `json:"verbal_score,omitempty" bson:"verbal_score,omitempty"`
	VerbalPercentage    int                   `json:"verbal_percentage,omitempty" bson:"verbal_percentage,omitempty"`
	LogicalScore        int                   `json:"logical_score,omitempty" bson:"logical_score,omitempty"`
	LogicalPercentage   int                   `json:"logical_percentage,omitempty" bson:"logical_percentage,omitempty"`
	AbstractScore       int                   `json:"abstract_score,omitempty" bson:"abstract_score,omitempty"`
	AbstractPercentage  int                   `json:"abstract_percentage,omitempty" bson:"abstract_percentage,omitempty"`
	SpatialScore        int                   `json:"spatial_score,omitempty" bson:"spatial_score,omitempty"`
	SpatialPercentage   int                   `json:"spatial_percentage,omitempty" bson:"spatial_percentage,omitempty"`
	Interpretation      string                `json:"interpretation" bson:"interpretation"`
	TotalTimeSpent      int                   `json:"total_time_spent" bson:"total_time_spent"`
	IsCompleted         bool                  `json:"is_completed" bson:"is_completed"`
	CompletedAt         time.Time             `json:"completed_at" bson:"completed_at"`
	CreatedAt           time.Time             `json:"created_at" bson:"created_at"`
	UpdatedAt           time.Time             `json:"updated_at" bson:"updated_at"`
}

type CognitiveTestSubmitRequest struct {
	UserID         string `json:"user_id" binding:"required"`
	TotalTimeSpent int    `json:"total_time_spent"`
	Answers        []struct {
		QuestionID     int `json:"question_id" binding:"required"`
		SelectedOption int `json:"selected_option" binding:"required"`
	} `json:"answers" binding:"required"`
}

type CognitiveTestRegistrationRequest struct {
}
