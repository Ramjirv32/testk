package models

import "time"

type TestType string

const (
	MVTITest      TestType = "mvti"
	CognitiveTest TestType = "cognitive"
)

type ConfidenceLevel string

const (
	Confident ConfidenceLevel = "confident"
	Unsure    ConfidenceLevel = "unsure"
	Guess     ConfidenceLevel = "guess"
)

type TestQuestion struct {
	QuestionID   int      `json:"question_id" bson:"question_id"`
	Question     string   `json:"question" bson:"question"`
	Options      []string `json:"options" bson:"options"`
	CorrectIndex int      `json:"correct_index" bson:"correct_index"`
	Hint         string   `json:"hint,omitempty" bson:"hint,omitempty"`
}

type UserAnswer struct {
	QuestionID     int    `json:"question_id" bson:"question_id"`
	Question       string `json:"question" bson:"question"`
	SelectedOption int    `json:"selected_option" bson:"selected_option"`
	CorrectOption  int    `json:"correct_option" bson:"correct_option"`
	IsCorrect      bool   `json:"is_correct" bson:"is_correct"`
}

type QuestionInteraction struct {
	QuestionID      int             `json:"question_id" bson:"question_id"`
	IsBookmarked    bool            `json:"is_bookmarked" bson:"is_bookmarked"`
	MarkedForReview bool            `json:"marked_for_review" bson:"marked_for_review"`
	ConfidenceLevel ConfidenceLevel `json:"confidence_level" bson:"confidence_level"`
	Note            string          `json:"note" bson:"note"`
	TimeSpent       int             `json:"time_spent" bson:"time_spent"`
	AnswerChanges   int             `json:"answer_changes" bson:"answer_changes"`
	HintUsed        bool            `json:"hint_used" bson:"hint_used"`
	FlaggedAsIssue  bool            `json:"flagged_as_issue" bson:"flagged_as_issue"`
	FlagReason      string          `json:"flag_reason" bson:"flag_reason"`
	FirstVisitTime  time.Time       `json:"first_visit_time" bson:"first_visit_time"`
	LastVisitTime   time.Time       `json:"last_visit_time" bson:"last_visit_time"`
}

type TestSession struct {
	ID                   string                      `json:"id" bson:"_id,omitempty"`
	UserID               string                      `json:"user_id" bson:"user_id"`
	Email                string                      `json:"email" bson:"email"`
	TestType             TestType                    `json:"test_type" bson:"test_type"`
	StartTime            time.Time                   `json:"start_time" bson:"start_time"`
	EndTime              time.Time                   `json:"end_time" bson:"end_time"`
	TotalTimeSpent       int                         `json:"total_time_spent" bson:"total_time_spent"`
	PauseCount           int                         `json:"pause_count" bson:"pause_count"`
	TabSwitchCount       int                         `json:"tab_switch_count" bson:"tab_switch_count"`
	FullscreenExitCount  int                         `json:"fullscreen_exit_count" bson:"fullscreen_exit_count"`
	DeviceInfo           string                      `json:"device_info" bson:"device_info"`
	QuestionInteractions map[int]QuestionInteraction `json:"question_interactions" bson:"question_interactions"`
	CreatedAt            time.Time                   `json:"created_at" bson:"created_at"`
	UpdatedAt            time.Time                   `json:"updated_at" bson:"updated_at"`
}

type TestResult struct {
	ID                   string                      `json:"id" bson:"_id,omitempty"`
	UserID               string                      `json:"user_id" bson:"user_id"`
	Email                string                      `json:"email" bson:"email"`
	TestType             TestType                    `json:"test_type" bson:"test_type"`
	MBTIType             string                      `json:"mbti_type,omitempty" bson:"mbti_type,omitempty"`
	Age                  int                         `json:"age" bson:"age"`
	StudentType          string                      `json:"student_type" bson:"student_type"`
	Answers              []UserAnswer                `json:"answers" bson:"answers"`
	QuestionInteractions map[int]QuestionInteraction `json:"question_interactions" bson:"question_interactions"`
	TotalScore           int                         `json:"total_score" bson:"total_score"`
	MaxScore             int                         `json:"max_score" bson:"max_score"`
	Percentage           float64                     `json:"percentage" bson:"percentage"`
	TotalTimeSpent       int                         `json:"total_time_spent" bson:"total_time_spent"`
	BookmarkedCount      int                         `json:"bookmarked_count" bson:"bookmarked_count"`
	ReviewedCount        int                         `json:"reviewed_count" bson:"reviewed_count"`
	HintsUsedCount       int                         `json:"hints_used_count" bson:"hints_used_count"`
	ConfidentAnswers     int                         `json:"confident_answers" bson:"confident_answers"`
	UnsureAnswers        int                         `json:"unsure_answers" bson:"unsure_answers"`
	GuessAnswers         int                         `json:"guess_answers" bson:"guess_answers"`
	IsCompleted          bool                        `json:"is_completed" bson:"is_completed"`
	CompletedAt          time.Time                   `json:"completed_at" bson:"completed_at"`
	CreatedAt            time.Time                   `json:"created_at" bson:"created_at"`
	UpdatedAt            time.Time                   `json:"updated_at" bson:"updated_at"`
}

type SubmitTestRequest struct {
	UserID         string `json:"user_id" binding:"required"`
	TestType       string `json:"test_type" binding:"required"`
	TotalTimeSpent int    `json:"total_time_spent"`
	Answers        []struct {
		QuestionID     int `json:"question_id" binding:"required"`
		SelectedOption int `json:"selected_option" binding:"required"`
	} `json:"answers" binding:"required"`
	QuestionInteractions map[string]QuestionInteraction `json:"question_interactions"`
}

type SaveProgressRequest struct {
	UserID               string                         `json:"user_id" binding:"required"`
	TestType             string                         `json:"test_type" binding:"required"`
	CurrentAnswers       map[string]int                 `json:"current_answers"`
	QuestionInteractions map[string]QuestionInteraction `json:"question_interactions"`
	TimeSpent            int                            `json:"time_spent"`
}

type FlagQuestionRequest struct {
	UserID     string `json:"user_id" binding:"required"`
	TestType   string `json:"test_type" binding:"required"`
	QuestionID int    `json:"question_id" binding:"required"`
	Reason     string `json:"reason" binding:"required"`
	Details    string `json:"details"`
}

type BehavioralTestResult struct {
	ID             interface{}  `json:"id" bson:"_id,omitempty"`
	UserID         string       `json:"user_id" bson:"user_id"`
	UserName       string       `json:"user_name" bson:"user_name"`
	UserEmail      string       `json:"user_email" bson:"user_email"`
	Age            int          `json:"age" bson:"age"`
	StudentType    string       `json:"student_type" bson:"student_type"`
	TotalScore     int          `json:"total_score" bson:"total_score"`
	MaxScore       int          `json:"max_score" bson:"max_score"`
	Percentage     float64      `json:"percentage" bson:"percentage"`
	Interpretation string       `json:"interpretation" bson:"interpretation"`
	Answers        []UserAnswer `json:"answers" bson:"answers"`
	TotalTimeSpent int          `json:"total_time_spent" bson:"total_time_spent"`
	IsCompleted    bool         `json:"is_completed" bson:"is_completed"`
	CompletedAt    time.Time    `json:"completed_at" bson:"completed_at"`
}

type BehavioralSubmitRequest struct {
	UserID         string `json:"user_id"`
	TotalTimeSpent int    `json:"total_time_spent"`
	Answers        []struct {
		QuestionID     int `json:"question_id"`
		SelectedOption int `json:"selected_option"`
	} `json:"answers"`
}
