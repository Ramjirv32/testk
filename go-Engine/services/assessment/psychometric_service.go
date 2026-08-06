package assessmentsvc

import (
	"context"
	"errors"
	"fmt"
	"gobackend/config"
	"gobackend/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	authsvc "gobackend/services/auth"
	"gobackend/services/realtime"
)

var (
	psychometricRegistrationCollection *mongo.Collection
	psychometricResultCollection       *mongo.Collection
)

func init() {

}

func NewPsychometricService() *PsychometricService {
	if psychometricRegistrationCollection == nil {
		psychometricRegistrationCollection = config.TruDB.Collection("psychometric_registrations")
	}
	if psychometricResultCollection == nil {
		psychometricResultCollection = config.TruDB.Collection("psychometric_results")
	}
	return &PsychometricService{}
}

type PsychometricService struct{}

func (s *PsychometricService) GetPsychometricQuestions() []models.PsychometricQuestion {
	return []models.PsychometricQuestion{
		{QuestionID: 1, Question: "I enjoy solving puzzles or figuring out how things work", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 2, Question: "I can easily stay focused when I am working on a task", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 3, Question: "I am confident in my ability to learn new things", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 4, Question: "I handle stress well when things don't go as planned", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 5, Question: "I enjoy being creative and coming up with new ideas", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 6, Question: "I find it easy to work with others in a group", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 7, Question: "I am good at understanding how other people feel", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 8, Question: "I am comfortable leading a team or a group project", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 9, Question: "I am patient when I have to wait for something", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 10, Question: "I am organized and keep my things in order", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 11, Question: "I like to explore new places and experiences", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 12, Question: "I can easily adapt to new situations or changes", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 13, Question: "I am good at managing my time and completing tasks on time", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 14, Question: "I feel confident when speaking in front of a class or group", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 15, Question: "I always try to do my best in everything I do", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
	}
}

func (s *PsychometricService) RegisterForTest(userID, email string, req models.PsychometricRegistrationRequest) error {
	ctx := context.Background()

	var existing models.PsychometricRegistration
	err := psychometricRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
		"status":  bson.M{"$in": []string{"pending", "approved"}},
	}).Decode(&existing)

	if err == nil {
		return errors.New("you already have a pending or approved registration")
	}

	user, err := authsvc.GetUserByID(userID)
	if err != nil {
		return errors.New("failed to fetch user details")
	}

	var profile models.StudentProfile
	profileCollection := config.TruDB.Collection("student_profiles")
	err = profileCollection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&profile)

	name := email
	if err == nil && profile.FullName != "" {
		name = profile.FullName
	}

	age := user.Age
	studentType := user.StudentType

	if studentType == "" {
		if age < 16 {
			studentType = "school"
		} else if age < 18 {
			studentType = "high_school"
		} else {
			studentType = "university"
		}
	}

	registration := models.PsychometricRegistration{
		ID:          primitive.NewObjectID().Hex(),
		UserID:      userID,
		Email:       email,
		Name:        name,
		Age:         age,
		StudentType: studentType,
		Status:      "pending",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err = psychometricRegistrationCollection.InsertOne(ctx, registration)
	return err
}

func (s *PsychometricService) GetUserRegistration(userID string) (*models.PsychometricRegistration, error) {
	ctx := context.Background()
	var registration models.PsychometricRegistration

	err := psychometricRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
	}).Decode(&registration)

	if err != nil {
		return nil, err
	}

	return &registration, nil
}

func (s *PsychometricService) GetAllRegistrations(status string) ([]models.PsychometricRegistration, error) {
	ctx := context.Background()
	var registrations []models.PsychometricRegistration

	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := psychometricRegistrationCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &registrations); err != nil {
		return nil, err
	}

	return registrations, nil
}

func (s *PsychometricService) ApproveRegistration(registrationID, adminEmail string) error {
	ctx := context.Background()

	var registration models.PsychometricRegistration
	err := psychometricRegistrationCollection.FindOne(ctx, bson.M{"_id": registrationID}).Decode(&registration)
	if err != nil {
		return fmt.Errorf("failed to find registration: %v", err)
	}

	_, err = psychometricRegistrationCollection.UpdateOne(
		ctx,
		bson.M{"_id": registrationID},
		bson.M{
			"$set": bson.M{
				"status":      "approved",
				"approved_at": time.Now(),
				"approved_by": adminEmail,
				"updated_at":  time.Now(),
			},
		},
	)

	if err == nil {

		realtime.BroadcastPsychometricApproval(registration.UserID)
	}

	return err
}

func (s *PsychometricService) RejectRegistration(registrationID, reason string) error {
	ctx := context.Background()

	_, err := psychometricRegistrationCollection.UpdateOne(
		ctx,
		bson.M{"_id": registrationID},
		bson.M{
			"$set": bson.M{
				"status":     "rejected",
				"reason":     reason,
				"updated_at": time.Now(),
			},
		},
	)

	return err
}

func (s *PsychometricService) SubmitTest(userID, email string, req models.PsychometricSubmitRequest) (*models.PsychometricResult, error) {
	ctx := context.Background()

	var registration models.PsychometricRegistration
	err := psychometricRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
		"status":  "approved",
	}).Decode(&registration)

	if err != nil {
		return nil, errors.New("you must have an approved registration to take the test")
	}

	var existing models.PsychometricResult
	err = psychometricResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&existing)

	if err == nil {
		return nil, errors.New("you have already completed this test")
	}

	questions := s.GetPsychometricQuestions()
	questionMap := make(map[int]models.PsychometricQuestion)
	for _, q := range questions {
		questionMap[q.QuestionID] = q
	}

	var answers []models.PsychometricAnswer
	totalScore := 0
	maxScore := len(questions) * 5

	for _, ans := range req.Answers {
		question, exists := questionMap[ans.QuestionID]
		if !exists {
			return nil, fmt.Errorf("invalid question ID: %d", ans.QuestionID)
		}

		score := 6 - ans.SelectedOption
		if score < 1 {
			score = 1
		} else if score > 5 {
			score = 5
		}

		answers = append(answers, models.PsychometricAnswer{
			QuestionID:     ans.QuestionID,
			Question:       question.Question,
			SelectedOption: ans.SelectedOption,
			Score:          score,
		})

		totalScore += score
	}

	percentage := float64(totalScore) / float64(maxScore) * 100

	interpretation := s.getInterpretation(totalScore, percentage)

	certificateURL := fmt.Sprintf("/api/certificates/psychometric/%s", userID)

	result := models.PsychometricResult{
		ID:             primitive.NewObjectID().Hex(),
		UserID:         userID,
		Email:          email,
		Name:           registration.Name,
		Age:            registration.Age,
		StudentType:    registration.StudentType,
		Answers:        answers,
		TotalScore:     totalScore,
		MaxScore:       maxScore,
		Percentage:     percentage,
		Interpretation: interpretation,
		CertificateURL: certificateURL,
		TotalTimeSpent: req.TotalTimeSpent,
		IsCompleted:    true,
		CompletedAt:    time.Now(),
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	_, err = psychometricResultCollection.InsertOne(ctx, result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *PsychometricService) getInterpretation(totalScore int, percentage float64) string {
	if totalScore >= 60 {
		return "Highly developed cognitive, emotional, and behavioural skills. Shows strong adaptability, creativity, and social awareness."
	} else if totalScore >= 45 {
		return "Moderately developed traits. The individual has good strengths but can improve consistency in emotional regulation or focus."
	} else if totalScore >= 30 {
		return "Average range. Indicates balanced tendencies but may need support in maintaining confidence or concentration."
	}
	return "Needs improvement. Suggests challenges in emotional control, confidence, attention, or social interaction. Additional guidance or structured coaching may help."
}

func (s *PsychometricService) GetUserResult(userID string) (*models.PsychometricResult, error) {
	ctx := context.Background()
	var result models.PsychometricResult

	err := psychometricResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *PsychometricService) GetAllResults() ([]models.PsychometricResult, error) {
	ctx := context.Background()
	var results []models.PsychometricResult

	cursor, err := psychometricResultCollection.Find(ctx, bson.M{"is_completed": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	return results, nil
}

func (s *PsychometricService) GetResultByID(resultID string) (*models.PsychometricResult, error) {
	ctx := context.Background()
	var result models.PsychometricResult

	err := psychometricResultCollection.FindOne(ctx, bson.M{
		"_id":          resultID,
		"is_completed": true,
	}).Decode(&result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}
