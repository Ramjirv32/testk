package assessmentsvc

import (
	"context"
	"errors"
	"fmt"
	"gobackend/config"
	"gobackend/models"
	"time"

	authsvc "gobackend/services/auth"
	"gobackend/services/realtime"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var (
	behavioralRegistrationCollection *mongo.Collection
	behavioralResultCollection       *mongo.Collection
)

type BehavioralTestService struct{}

func NewBehavioralTestService() *BehavioralTestService {
	if behavioralRegistrationCollection == nil {
		behavioralRegistrationCollection = config.TruDB.Collection("behavioral_registrations")
	}
	if behavioralResultCollection == nil {
		behavioralResultCollection = config.TruDB.Collection("behavioral_test_results")
	}
	return &BehavioralTestService{}
}

func (s *BehavioralTestService) GetBehavioralQuestions() []models.TestQuestion {
	return []models.TestQuestion{
		{QuestionID: 1, Question: "I enjoy solving puzzles or figuring out how things work.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 2, Question: "I find it easy to express my feelings.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 3, Question: "I like working with others rather than working alone.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 4, Question: "I stay calm even when things don't go as planned.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 5, Question: "I enjoy learning new things and exploring different subjects.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 6, Question: "I can focus on a task for a long period without getting distracted.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 7, Question: "I try to understand how others feel in different situations.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 8, Question: "I enjoy creative activities like drawing, writing, or music.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 9, Question: "When I face a problem, I look for multiple solutions.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 10, Question: "I adjust easily when my routine changes.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 11, Question: "I follow instructions carefully and pay attention to details.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 12, Question: "I like participating in group discussions or sharing ideas.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 13, Question: "I finish my tasks on time and rarely procrastinate.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 14, Question: "I remain confident even when I make mistakes.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
		{QuestionID: 15, Question: "I enjoy taking up new challenges.", Options: []string{"Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"}},
	}
}

func (s *BehavioralTestService) RegisterForTest(userID, email string) error {
	ctx := context.Background()

	var existing models.PsychometricRegistration
	err := behavioralRegistrationCollection.FindOne(ctx, bson.M{
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

	if user.Age > 15 {
		return errors.New("behavioral test is only available for students aged 15 and below")
	}

	var profile models.StudentProfile
	profileCollection := config.TruDB.Collection("student_profiles")
	err = profileCollection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&profile)

	name := email
	if err == nil && profile.FullName != "" {
		name = profile.FullName
	}

	studentType := user.StudentType
	if studentType == "" {
		studentType = "school"
	}

	registration := models.PsychometricRegistration{
		ID:          primitive.NewObjectID().Hex(),
		UserID:      userID,
		Email:       email,
		Name:        name,
		Age:         user.Age,
		StudentType: studentType,
		Status:      "pending",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err = behavioralRegistrationCollection.InsertOne(ctx, registration)
	return err
}

func (s *BehavioralTestService) GetUserRegistration(userID string) (*models.PsychometricRegistration, error) {
	ctx := context.Background()
	var registration models.PsychometricRegistration

	err := behavioralRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
	}).Decode(&registration)

	if err != nil {
		return nil, err
	}

	return &registration, nil
}

func (s *BehavioralTestService) GetAllRegistrations(status string) ([]models.PsychometricRegistration, error) {
	ctx := context.Background()
	var registrations []models.PsychometricRegistration

	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := behavioralRegistrationCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &registrations); err != nil {
		return nil, err
	}

	return registrations, nil
}

func (s *BehavioralTestService) ApproveRegistration(registrationID, adminEmail string) error {
	ctx := context.Background()

	var registration models.PsychometricRegistration
	err := behavioralRegistrationCollection.FindOne(ctx, bson.M{"_id": registrationID}).Decode(&registration)
	if err != nil {
		return err
	}

	_, err = behavioralRegistrationCollection.UpdateOne(
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
	if err != nil {
		return err
	}

	realtime.BroadcastBehavioralApproval(registration.UserID)
	return nil
}

func (s *BehavioralTestService) RejectRegistration(registrationID, reason string) error {
	ctx := context.Background()

	_, err := behavioralRegistrationCollection.UpdateOne(
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

func (s *BehavioralTestService) SubmitTest(userID, email string, req models.BehavioralSubmitRequest) (*models.BehavioralTestResult, error) {
	ctx := context.Background()

	var registration models.PsychometricRegistration
	err := behavioralRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
		"status":  "approved",
	}).Decode(&registration)

	if err != nil {
		return nil, errors.New("you must have an approved registration to take the test")
	}

	var existing models.BehavioralTestResult
	err = behavioralResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&existing)

	if err == nil {
		return nil, errors.New("you have already completed this test")
	}

	questions := s.GetBehavioralQuestions()
	questionMap := make(map[int]models.TestQuestion)
	for _, q := range questions {
		questionMap[q.QuestionID] = q
	}

	totalScore := 0
	var userAnswers []models.UserAnswer

	for _, answer := range req.Answers {
		question, exists := questionMap[answer.QuestionID]
		if !exists {
			return nil, fmt.Errorf("invalid question ID: %d", answer.QuestionID)
		}

		score := 5 - answer.SelectedOption

		totalScore += score

		userAnswers = append(userAnswers, models.UserAnswer{
			QuestionID:     answer.QuestionID,
			Question:       question.Question,
			SelectedOption: answer.SelectedOption,
			CorrectOption:  -1,
			IsCorrect:      true,
		})
	}

	maxScore := 75
	percentage := (float64(totalScore) / float64(maxScore)) * 100
	interpretation := s.getInterpretation(totalScore)

	result := models.BehavioralTestResult{
		ID:             primitive.NewObjectID(),
		UserID:         userID,
		UserName:       registration.Name,
		UserEmail:      email,
		Age:            registration.Age,
		StudentType:    registration.StudentType,
		TotalScore:     totalScore,
		MaxScore:       maxScore,
		Percentage:     percentage,
		Interpretation: interpretation,
		Answers:        userAnswers,
		TotalTimeSpent: req.TotalTimeSpent,
		IsCompleted:    true,
		CompletedAt:    time.Now(),
	}

	_, err = behavioralResultCollection.InsertOne(ctx, result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *BehavioralTestService) getInterpretation(score int) string {
	if score >= 60 {
		return "Highly developed cognitive, emotional, and behavioural skills. Shows strong adaptability, creativity, and social awareness."
	} else if score >= 45 {
		return "Moderately developed traits. You have good strengths but can improve consistency in emotional regulation or focus."
	} else if score >= 30 {
		return "Average range. Indicates balanced tendencies but may need support in maintaining confidence or concentration."
	} else {
		return "Needs improvement. Suggests challenges in emotional control, confidence, attention, or social interaction. Additional guidance or structured coaching may help."
	}
}

func (s *BehavioralTestService) GetUserResult(userID string) (*models.BehavioralTestResult, error) {
	ctx := context.Background()
	var result models.BehavioralTestResult

	err := behavioralResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&result)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("no test result found")
		}
		return nil, err
	}

	return &result, nil
}

func (s *BehavioralTestService) GetAllResults() ([]models.BehavioralTestResult, error) {
	ctx := context.Background()
	var results []models.BehavioralTestResult

	cursor, err := behavioralResultCollection.Find(ctx, bson.M{"is_completed": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	return results, nil
}

func (s *BehavioralTestService) GetResultByID(resultID string) (*models.BehavioralTestResult, error) {
	ctx := context.Background()
	var result models.BehavioralTestResult

	objID, err := primitive.ObjectIDFromHex(resultID)
	if err != nil {
		return nil, errors.New("invalid result ID format")
	}

	err = behavioralResultCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("test result not found")
		}
		return nil, err
	}

	return &result, nil
}
