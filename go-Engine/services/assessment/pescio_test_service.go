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
	pescioRegistrationCollection *mongo.Collection
	pescioResultCollection       *mongo.Collection
)

func NewPESCIOService() *PESCIOService {
	if pescioRegistrationCollection == nil {
		pescioRegistrationCollection = config.TruDB.Collection("pescio_registrations")
	}
	if pescioResultCollection == nil {
		pescioResultCollection = config.TruDB.Collection("pescio_results")
	}
	return &PESCIOService{}
}

type PESCIOService struct{}

func (s *PESCIOService) GetPESCIOQuestions() []models.PescioTestQuestion {
	return []models.PescioTestQuestion{

		{QuestionID: 1, Question: "I like working out how to get things done efficiently", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 2, Question: "I like repairing and fixing machines", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 3, Question: "I like producing designs from my own ideas", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 4, Question: "I like being physically active", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 5, Question: "I like managing a team of people", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 6, Question: "I like working out problems", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},

		{QuestionID: 7, Question: "I like working with people", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 8, Question: "I like getting the details right", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 9, Question: "I like to be different", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 10, Question: "I like exploring new ideas for research purposes", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 11, Question: "I like helping people learn new skills", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 12, Question: "I like making or building things with my hands", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},

		{QuestionID: 13, Question: "I like gathering information", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 14, Question: "I like learning new things", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 15, Question: "I like using my imagination in my work", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 16, Question: "I like persuading people to do or to buy something", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 17, Question: "I like organising things, people and events", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 18, Question: "I like providing care for people in some way", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},

		{QuestionID: 19, Question: "I like making decisions", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 20, Question: "I like carrying out research projects", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 21, Question: "I like briefing a sales team about a new product", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 22, Question: "I like making lists", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 23, Question: "I like expressing myself in music, painting or writing", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 24, Question: "I like working with community groups", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},

		{QuestionID: 25, Question: "I like questioning established theories", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 26, Question: "I like taking calculated risks", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 27, Question: "I like designing or servicing equipment", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 28, Question: "I like analysing statistical data", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 29, Question: "I like working outside in the fresh air", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 30, Question: "I like listening to people's problems", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},

		{QuestionID: 31, Question: "I like analysing a company's annual accounts", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 32, Question: "I like selling something I have created", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 33, Question: "I like writing letters, reports and articles", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 34, Question: "I like using hand/machine tools to make things", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 35, Question: "I like being involved in a community arts project", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
		{QuestionID: 36, Question: "I like giving advice on grants or benefits", Options: []string{"Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"}},
	}
}

func (s *PESCIOService) RegisterForTest(userID, email string) error {
	ctx := context.Background()

	var existing models.PescioTestRegistration
	err := pescioRegistrationCollection.FindOne(ctx, bson.M{
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

	registration := models.PescioTestRegistration{
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

	_, err = pescioRegistrationCollection.InsertOne(ctx, registration)
	return err
}

func (s *PESCIOService) GetUserRegistration(userID string) (*models.PescioTestRegistration, error) {
	ctx := context.Background()
	var registration models.PescioTestRegistration

	err := pescioRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
	}).Decode(&registration)

	if err != nil {
		return nil, err
	}

	return &registration, nil
}

func (s *PESCIOService) GetAllRegistrations(status string) ([]models.PescioTestRegistration, error) {
	ctx := context.Background()
	var registrations []models.PescioTestRegistration

	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := pescioRegistrationCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &registrations); err != nil {
		return nil, err
	}

	return registrations, nil
}

func (s *PESCIOService) ApproveRegistration(registrationID, adminEmail string) error {
	ctx := context.Background()

	var registration models.PescioTestRegistration
	err := pescioRegistrationCollection.FindOne(ctx, bson.M{"_id": registrationID}).Decode(&registration)
	if err != nil {
		return err
	}

	_, err = pescioRegistrationCollection.UpdateOne(
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

	realtime.BroadcastPESCIOApproval(registration.UserID)

	return nil
}

func (s *PESCIOService) RejectRegistration(registrationID, reason string) error {
	ctx := context.Background()

	_, err := pescioRegistrationCollection.UpdateOne(
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

func (s *PESCIOService) SubmitTest(userID, email string, req models.PescioTestSubmitRequest) (*models.PescioTestResult, error) {
	ctx := context.Background()

	var registration models.PescioTestRegistration
	err := pescioRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
		"status":  "approved",
	}).Decode(&registration)

	if err != nil {
		return nil, errors.New("you must have an approved registration to take the test")
	}

	var existing models.PescioTestResult
	err = pescioResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&existing)

	if err == nil {
		return nil, errors.New("you have already completed this test")
	}

	questions := s.GetPESCIOQuestions()
	questionMap := make(map[int]models.PescioTestQuestion)
	for _, q := range questions {
		questionMap[q.QuestionID] = q
	}

	practicalQs := []int{2, 4, 12, 27, 29, 34}
	enterprisingQs := []int{5, 16, 19, 21, 26, 32}
	socialQs := []int{7, 11, 18, 24, 30, 35, 36}
	creativeQs := []int{8, 17, 22, 31}
	investigativeQs := []int{6, 10, 13, 14, 20, 25, 28}
	organisationalQs := []int{1, 3, 9, 15, 23, 33}

	categoryScores := map[string]int{
		"P": 0,
		"E": 0,
		"S": 0,
		"C": 0,
		"I": 0,
		"O": 0,
	}

	var answers []models.PescioTestAnswer
	totalScore := 0

	for _, ans := range req.Answers {
		question, exists := questionMap[ans.QuestionID]
		if !exists {
			return nil, fmt.Errorf("invalid question ID: %d", ans.QuestionID)
		}

		score := ans.SelectedOption + 1

		answers = append(answers, models.PescioTestAnswer{
			QuestionID:     ans.QuestionID,
			Question:       question.Question,
			SelectedOption: ans.SelectedOption,
			Score:          score,
		})

		totalScore += score

		qid := ans.QuestionID
		if containsInt(practicalQs, qid) {
			categoryScores["P"] += score
		} else if containsInt(enterprisingQs, qid) {
			categoryScores["E"] += score
		} else if containsInt(socialQs, qid) {
			categoryScores["S"] += score
		} else if containsInt(creativeQs, qid) {
			categoryScores["C"] += score
		} else if containsInt(investigativeQs, qid) {
			categoryScores["I"] += score
		} else if containsInt(organisationalQs, qid) {
			categoryScores["O"] += score
		}
	}

	interpretation := s.getPESCIOInterpretation(categoryScores)

	result := models.PescioTestResult{
		ID:                  primitive.NewObjectID().Hex(),
		UserID:              userID,
		Email:               email,
		Name:                registration.Name,
		Age:                 registration.Age,
		StudentType:         registration.StudentType,
		Answers:             answers,
		TotalScore:          totalScore,
		MaxScore:            180,
		Interpretation:      interpretation,
		PracticalScore:      categoryScores["P"],
		EnterprisingScore:   categoryScores["E"],
		SocialScore:         categoryScores["S"],
		CreativeScore:       categoryScores["C"],
		InvestigativeScore:  categoryScores["I"],
		OrganisationalScore: categoryScores["O"],
		TotalTimeSpent:      req.TotalTimeSpent,
		IsCompleted:         true,
		CompletedAt:         time.Now(),
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	_, err = pescioResultCollection.InsertOne(ctx, result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func containsInt(slice []int, val int) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

func (s *PESCIOService) getPESCIOInterpretation(categoryScores map[string]int) string {
	type CategoryScore struct {
		Category string
		Score    int
		Name     string
		Desc     string
	}

	categories := []CategoryScore{
		{"P", categoryScores["P"], "Practical", "You enjoy working with tools, machines, or hands-on activities. You prefer solving manual, mechanical, or electronic problems."},
		{"E", categoryScores["E"], "Enterprising", "You enjoy organizing projects, taking risks, and influencing others. You are ambitious, outgoing, and energetic."},
		{"S", categoryScores["S"], "Social", "You enjoy working with people, being friendly, helpful, and sensitive to others. You like training, informing, and helping people."},
		{"C", categoryScores["C"], "Creative", "You enjoy developing skills in art, music, drama, or writing. You are talented, expressive, and want to use your creative abilities."},
		{"I", categoryScores["I"], "Investigative", "You enjoy intellectual challenges and using your thinking skills. You are curious, logical, and interested in solving problems."},
		{"O", categoryScores["O"], "Organisational", "You enjoy working with data and systems. You are good with details, accurate, and prefer structured work environments."},
	}

	for i := 0; i < len(categories); i++ {
		for j := i + 1; j < len(categories); j++ {
			if categories[j].Score > categories[i].Score {
				categories[i], categories[j] = categories[j], categories[i]
			}
		}
	}

	interpretation := "Your top interest areas are:\n\n"
	interpretation += fmt.Sprintf("1. %s (Score: %d): %s\n\n", categories[0].Name, categories[0].Score, categories[0].Desc)
	interpretation += fmt.Sprintf("2. %s (Score: %d): %s\n\n", categories[1].Name, categories[1].Score, categories[1].Desc)
	interpretation += fmt.Sprintf("3. %s (Score: %d): %s\n\n", categories[2].Name, categories[2].Score, categories[2].Desc)
	interpretation += "These interests can help guide your career choices and educational path."

	return interpretation
}

func (s *PESCIOService) GetUserResult(userID string) (*models.PescioTestResult, error) {
	ctx := context.Background()
	var result models.PescioTestResult

	err := pescioResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *PESCIOService) GetAllResults() ([]models.PescioTestResult, error) {
	ctx := context.Background()
	var results []models.PescioTestResult

	cursor, err := pescioResultCollection.Find(ctx, bson.M{"is_completed": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	return results, nil
}

func (s *PESCIOService) GetResultByID(resultID string) (*models.PescioTestResult, error) {
	ctx := context.Background()
	var result models.PescioTestResult

	err := pescioResultCollection.FindOne(ctx, bson.M{"_id": resultID}).Decode(&result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}
