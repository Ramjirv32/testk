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
	mbtiRegistrationCollection *mongo.Collection
	mbtiResultCollection       *mongo.Collection
)

func NewMBTIService() *MBTIService {
	if mbtiRegistrationCollection == nil {
		mbtiRegistrationCollection = config.TruDB.Collection("mbti_registrations")
	}
	if mbtiResultCollection == nil {
		mbtiResultCollection = config.TruDB.Collection("mbti_results")
	}
	return &MBTIService{}
}

type MBTIService struct{}

func (s *MBTIService) GetMBTIQuestions() []models.MBTITestQuestion {
	return []models.MBTITestQuestion{
		{QuestionID: 1, Question: "At a party, you:", Options: []string{"Interact with many others, including strangers", "Interact with a few, known to you"}},
		{QuestionID: 2, Question: "You find it bores you to spend extensive time alone:", Options: []string{"True", "False"}},
		{QuestionID: 3, Question: "You find that you are a talkative person:", Options: []string{"Yes", "No"}},
		{QuestionID: 4, Question: "You prefer one-on-one conversations to group activities:", Options: []string{"No", "Yes"}},
		{QuestionID: 5, Question: "You feel comfortable just walking up to someone at a party and striking up a conversation:", Options: []string{"Yes", "No"}},
		{QuestionID: 6, Question: "You are energized by social interaction:", Options: []string{"Yes", "No"}},
		{QuestionID: 7, Question: "You prefer to be the center of attention rather than staying on the sideline:", Options: []string{"Yes", "No"}},
		{QuestionID: 8, Question: "You would be content to spend a Friday night by yourself:", Options: []string{"No", "Yes"}},
		{QuestionID: 9, Question: "You speak in a controlled manner with deliberate pauses:", Options: []string{"No", "Yes"}},
		{QuestionID: 10, Question: "You act quickly sometimes without thinking:", Options: []string{"Yes", "No"}},
		{QuestionID: 11, Question: "You would prefer to do something by yourself or with a small group:", Options: []string{"No", "Yes"}},
		{QuestionID: 12, Question: "You enjoy animated discussions:", Options: []string{"Yes", "No"}},
		{QuestionID: 13, Question: "You are comfortable with being the center of attention:", Options: []string{"Yes", "No"}},
		{QuestionID: 14, Question: "You feel drained after social interaction:", Options: []string{"No", "Yes"}},

		{QuestionID: 15, Question: "Is it worse to:", Options: []string{"Have your head in the clouds", "Be stuck in the mud"}},
		{QuestionID: 16, Question: "You prefer to be given explicit instructions on how to do something rather than asked to figure it out yourself:", Options: []string{"Yes", "No"}},
		{QuestionID: 17, Question: "Are you more interested in a practical idea that you can do something with right away:", Options: []string{"Yes", "No"}},
		{QuestionID: 18, Question: "When taking a trip, you would prefer to plan every detail in advance:", Options: []string{"Yes", "No"}},
		{QuestionID: 19, Question: "You like to think about using different methods to solve familiar problems rather than doing what is known to work:", Options: []string{"No", "Yes"}},
		{QuestionID: 20, Question: "You think that ideals are more important than facts:", Options: []string{"No", "Yes"}},
		{QuestionID: 21, Question: "You like to think of possible scenarios when making decisions:", Options: []string{"Yes", "No"}},
		{QuestionID: 22, Question: "You are practical and realistic:", Options: []string{"Yes", "No"}},
		{QuestionID: 23, Question: "Your head is always full of new ideas:", Options: []string{"Yes", "No"}},
		{QuestionID: 24, Question: "You trust your gut instincts rather than relying solely on facts and data:", Options: []string{"Yes", "No"}},
		{QuestionID: 25, Question: "You are comfortable seeing things as they are without needing to understand the deeper meaning:", Options: []string{"Yes", "No"}},
		{QuestionID: 26, Question: "You like to think about abstract concepts and theories:", Options: []string{"Yes", "No"}},
		{QuestionID: 27, Question: "You find it hard to imagine the future clearly:", Options: []string{"Yes", "No"}},
		{QuestionID: 28, Question: "You focus more on what is real and what you can actually see or touch:", Options: []string{"Yes", "No"}},

		{QuestionID: 29, Question: "You make decisions mostly based on logic and objective analysis:", Options: []string{"Yes", "No"}},
		{QuestionID: 30, Question: "You find it difficult to comfort people who are distressed:", Options: []string{"Yes", "No"}},
		{QuestionID: 31, Question: "You are easily hurt by criticism:", Options: []string{"No", "Yes"}},
		{QuestionID: 32, Question: "You believe it is more important to maintain harmony in your relationships than to always be honest:", Options: []string{"No", "Yes"}},
		{QuestionID: 33, Question: "You prioritize being tactful over being truthful:", Options: []string{"No", "Yes"}},
		{QuestionID: 34, Question: "You care more about the people involved than the objective facts of the situation:", Options: []string{"No", "Yes"}},
		{QuestionID: 35, Question: "You are not bothered much by emotional movies or books:", Options: []string{"Yes", "No"}},
		{QuestionID: 36, Question: "You believe that fairness should be based on equal treatment for all, regardless of individual circumstances:", Options: []string{"Yes", "No"}},
		{QuestionID: 37, Question: "You are a person who is very empathetic and often takes on the emotions of those around you:", Options: []string{"No", "Yes"}},
		{QuestionID: 38, Question: "You find it hard to understand people who become emotional over sentimental things:", Options: []string{"Yes", "No"}},
		{QuestionID: 39, Question: "You find that you often think of what other people need or want before thinking of your own needs:", Options: []string{"No", "Yes"}},
		{QuestionID: 40, Question: "Your heart often rules your head:", Options: []string{"No", "Yes"}},
		{QuestionID: 41, Question: "You usually have a more important reason for doing something than just helping someone else on a whim:", Options: []string{"Yes", "No"}},
		{QuestionID: 42, Question: "You believe the most important thing is to fulfill your duties and obligations:", Options: []string{"Yes", "No"}},

		{QuestionID: 43, Question: "You are more of a spontaneous person than a structured person:", Options: []string{"No", "Yes"}},
		{QuestionID: 44, Question: "You find it hard to adapt quickly when circumstances change unexpectedly:", Options: []string{"Yes", "No"}},
		{QuestionID: 45, Question: "Your workspace is usually:", Options: []string{"Organized and clean", "Cluttered and chaotic"}},
		{QuestionID: 46, Question: "You prefer to have a plan before starting a new project or trip:", Options: []string{"Yes", "No"}},
		{QuestionID: 47, Question: "You tend to procrastinate:", Options: []string{"No", "Yes"}},
		{QuestionID: 48, Question: "You prefer to be spontaneous and go with the flow:", Options: []string{"No", "Yes"}},
		{QuestionID: 49, Question: "You find it stressful to keep many projects in progress at the same time:", Options: []string{"Yes", "No"}},
		{QuestionID: 50, Question: "You try to be on time to places and appointments:", Options: []string{"Yes", "No"}},
		{QuestionID: 51, Question: "You prefer to let the music play and enjoy the mood rather than analyzing the composition and technique:", Options: []string{"No", "Yes"}},
		{QuestionID: 52, Question: "You enjoy having a set schedule and routine:", Options: []string{"Yes", "No"}},
		{QuestionID: 53, Question: "You are more of a planner than an improviser:", Options: []string{"Yes", "No"}},
		{QuestionID: 54, Question: "You make to-do lists and prioritize them by importance:", Options: []string{"Yes", "No"}},
		{QuestionID: 55, Question: "You like having many projects ongoing at once over working on a single project at a time:", Options: []string{"Yes", "No"}},
		{QuestionID: 56, Question: "You tend to finish things or tidy up before moving on to something else:", Options: []string{"Yes", "No"}},

		{QuestionID: 57, Question: "You would rather go to a party with a friend than go alone:", Options: []string{"Yes", "No"}},
		{QuestionID: 58, Question: "You focus more on the overall picture rather than specific details:", Options: []string{"Yes", "No"}},
		{QuestionID: 59, Question: "You are less concerned with how other people feel and more concerned with the truth:", Options: []string{"Yes", "No"}},
		{QuestionID: 60, Question: "You like to keep your options open rather than locking into a firm plan:", Options: []string{"Yes", "No"}},
		{QuestionID: 61, Question: "You find it easy to introduce yourself to new people:", Options: []string{"Yes", "No"}},
		{QuestionID: 62, Question: "You are more concerned with what is real and actual than what could be:", Options: []string{"Yes", "No"}},
		{QuestionID: 63, Question: "You make decisions based on established principles rather than circumstances:", Options: []string{"Yes", "No"}},
		{QuestionID: 64, Question: "You like things to be settled and decided:", Options: []string{"Yes", "No"}},
		{QuestionID: 65, Question: "You spend time reflecting internally more than externally participating:", Options: []string{"No", "Yes"}},
		{QuestionID: 66, Question: "You take the straightforward, literal meaning of words over reading between the lines:", Options: []string{"Yes", "No"}},
		{QuestionID: 67, Question: "You are more guided by your heart than your head in decisions:", Options: []string{"No", "Yes"}},
		{QuestionID: 68, Question: "You prefer to keep moving and doing things rather than sitting still:", Options: []string{"Yes", "No"}},
		{QuestionID: 69, Question: "You get energized through social interaction and group activities:", Options: []string{"Yes", "No"}},
		{QuestionID: 70, Question: "You think too little about what things could mean compared to what they actually are:", Options: []string{"No", "Yes"}},
	}
}

func (s *MBTIService) RegisterForTest(userID, email string, req models.MBTITestRegistrationRequest) error {
	ctx := context.Background()

	var existing models.MBTITestRegistration
	err := mbtiRegistrationCollection.FindOne(ctx, bson.M{
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

	if user.Age < 18 {
		return errors.New("you must be at least 18 years old to take the MBTI test")
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
		studentType = "university"
	}

	registration := models.MBTITestRegistration{
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

	_, err = mbtiRegistrationCollection.InsertOne(ctx, registration)
	return err
}

func (s *MBTIService) GetUserRegistration(userID string) (*models.MBTITestRegistration, error) {
	ctx := context.Background()
	var registration models.MBTITestRegistration

	err := mbtiRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
	}).Decode(&registration)

	if err != nil {
		return nil, err
	}

	return &registration, nil
}

func (s *MBTIService) GetAllRegistrations(status string) ([]models.MBTITestRegistration, error) {
	ctx := context.Background()
	var registrations []models.MBTITestRegistration

	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := mbtiRegistrationCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &registrations); err != nil {
		return nil, err
	}

	return registrations, nil
}

func (s *MBTIService) ApproveRegistration(registrationID, adminEmail string) error {
	ctx := context.Background()

	var registration models.MBTITestRegistration
	err := mbtiRegistrationCollection.FindOne(ctx, bson.M{"_id": registrationID}).Decode(&registration)
	if err != nil {
		return err
	}

	_, err = mbtiRegistrationCollection.UpdateOne(
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

	realtime.BroadcastMBTIApproval(registration.UserID)

	return nil
}

func (s *MBTIService) RejectRegistration(registrationID, reason string) error {
	ctx := context.Background()

	_, err := mbtiRegistrationCollection.UpdateOne(
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

func (s *MBTIService) SubmitTest(userID, email string, req models.MBTITestSubmitRequest) (*models.MBTITestResult, error) {
	ctx := context.Background()

	var registration models.MBTITestRegistration
	err := mbtiRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
		"status":  "approved",
	}).Decode(&registration)

	if err != nil {
		return nil, errors.New("you must have an approved registration to take the test")
	}

	var existing models.MBTITestResult
	err = mbtiResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&existing)

	if err == nil {
		return nil, errors.New("you have already completed this test")
	}

	questions := s.GetMBTIQuestions()
	questionMap := make(map[int]models.MBTITestQuestion)
	for _, q := range questions {
		questionMap[q.QuestionID] = q
	}

	eiScore := 0
	snScore := 0
	tfScore := 0
	jpScore := 0

	var answers []models.MBTITestAnswer

	for _, ans := range req.Answers {
		question, exists := questionMap[ans.QuestionID]
		if !exists {
			return nil, fmt.Errorf("invalid question ID: %d", ans.QuestionID)
		}

		answers = append(answers, models.MBTITestAnswer{
			QuestionID:     ans.QuestionID,
			Question:       question.Question,
			SelectedOption: ans.SelectedOption,
		})

		score := 1
		if ans.SelectedOption == 1 {
			score = -1
		}

		switch question.Dimension {
		case "EI":
			eiScore += score
		case "SN":
			snScore += score
		case "TF":
			tfScore += score
		case "JP":
			jpScore += score
		}
	}

	e_i := "I"
	if eiScore > 0 {
		e_i = "E"
	}

	s_n := "N"
	if snScore > 0 {
		s_n = "S"
	}

	t_f := "F"
	if tfScore > 0 {
		t_f = "T"
	}

	j_p := "P"
	if jpScore > 0 {
		j_p = "J"
	}

	personalityType := fmt.Sprintf("%s%s%s%s", e_i, s_n, t_f, j_p)
	interpretation := s.getMBTIInterpretation(personalityType)

	result := models.MBTITestResult{
		ID:                       primitive.NewObjectID().Hex(),
		UserID:                   userID,
		Email:                    email,
		Name:                     registration.Name,
		Age:                      registration.Age,
		StudentType:              registration.StudentType,
		Answers:                  answers,
		MBTIType:                 personalityType,
		ExtroversionIntroversion: eiScore,
		SensingIntuition:         snScore,
		ThinkingFeeling:          tfScore,
		JudgingPerceiving:        jpScore,
		Interpretation:           interpretation,
		TotalTimeSpent:           req.TotalTimeSpent,
		IsCompleted:              true,
		CompletedAt:              time.Now(),
		CreatedAt:                time.Now(),
		UpdatedAt:                time.Now(),
	}

	_, err = mbtiResultCollection.InsertOne(ctx, result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *MBTIService) getMBTIInterpretation(personalityType string) string {
	interpretations := map[string]string{
		"ISTJ": "The Logistician - Responsible and fact-oriented, with natural leadership in a structured environment.",
		"ISFJ": "The Defender - Dedicated and supportive, with strong organizational skills and loyalty.",
		"INFJ": "The Advocate - Insightful and principled, driven by a vision for a better future.",
		"INTJ": "The Architect - Strategic and independent, with a drive to improve systems and ideas.",
		"ISTP": "The Virtuoso - Logical and practical, focused on understanding how things work.",
		"ISFP": "The Adventurer - Artistic and sensitive, with a strong personal value system.",
		"INFP": "The Mediator - Idealistic and creative, deeply interested in understanding people and possibilities.",
		"INTP": "The Logician - Analytical and innovative, driven by curiosity and intellectual pursuits.",
		"ESTP": "The Entrepreneur - Energetic and pragmatic, with a natural ability to navigate challenges.",
		"ESFP": "The Entertainer - Outgoing and spontaneous, with a talent for bringing excitement to any situation.",
		"ENFP": "The Campaigner - Enthusiastic and imaginative, with a passion for new ideas and possibilities.",
		"ENTP": "The Debater - Intelligent and curious, with a love of debate and strategic thinking.",
		"ESTJ": "The Executive - Efficient and organized, with natural leadership and dedication to duty.",
		"ESFJ": "The Consul - Conscientious and responsible, with a focus on group harmony and tradition.",
		"ENFJ": "The Protagonist - Natural leaders with charisma and a strong drive to help others succeed.",
		"ENTJ": "The Commander - Strategic and commanding, with a natural gift for long-term planning.",
	}

	if interpretation, exists := interpretations[personalityType]; exists {
		return interpretation
	}

	return "Your personality type provides unique strengths and perspectives valuable in various aspects of life and career."
}

func (s *MBTIService) GetUserResult(userID string) (*models.MBTITestResult, error) {
	ctx := context.Background()
	var result models.MBTITestResult

	err := mbtiResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *MBTIService) GetAllResults() ([]models.MBTITestResult, error) {
	ctx := context.Background()
	var results []models.MBTITestResult

	cursor, err := mbtiResultCollection.Find(ctx, bson.M{"is_completed": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	return results, nil
}

func (s *MBTIService) GetResultByID(resultID string) (*models.MBTITestResult, error) {
	ctx := context.Background()
	var result models.MBTITestResult

	err := mbtiResultCollection.FindOne(ctx, bson.M{"_id": resultID}).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("result not found")
		}
		return nil, err
	}

	return &result, nil
}
