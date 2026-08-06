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
	cognitiveRegistrationCollection *mongo.Collection
	cognitiveResultCollection       *mongo.Collection
)

func NewCognitiveService() *CognitiveService {
	if cognitiveRegistrationCollection == nil {
		cognitiveRegistrationCollection = config.TruDB.Collection("cognitive_registrations")
	}
	if cognitiveResultCollection == nil {
		cognitiveResultCollection = config.TruDB.Collection("cognitive_results")
	}
	return &CognitiveService{}
}

type CognitiveService struct{}

func (s *CognitiveService) GetCognitiveQuestions() []models.CognitiveTestQuestion {
	return []models.CognitiveTestQuestion{

		{QuestionID: 1, Category: "Numerical", Question: "If 2x + 3 = 11, what is x?", Options: []string{"3", "4", "5", "6"}, CorrectAnswer: 1},
		{QuestionID: 2, Category: "Numerical", Question: "What is 15% of 200?", Options: []string{"20", "25", "30", "35"}, CorrectAnswer: 2},
		{QuestionID: 3, Category: "Numerical", Question: "A train travels 120 km in 2 hours. What is its average speed?", Options: []string{"50 km/h", "60 km/h", "70 km/h", "80 km/h"}, CorrectAnswer: 1},
		{QuestionID: 4, Category: "Numerical", Question: "What is the sum of the first 10 natural numbers?", Options: []string{"45", "55", "60", "75"}, CorrectAnswer: 1},
		{QuestionID: 5, Category: "Numerical", Question: "If a book costs Rs. 250 and is sold at 20% discount, what is the selling price?", Options: []string{"Rs. 150", "Rs. 175", "Rs. 200", "Rs. 225"}, CorrectAnswer: 2},
		{QuestionID: 6, Category: "Numerical", Question: "What is the area of a circle with radius 5 cm?", Options: []string{"78.5 sq cm", "87.5 sq cm", "90 sq cm", "100 sq cm"}, CorrectAnswer: 0},
		{QuestionID: 7, Category: "Numerical", Question: "If 3 workers can complete a job in 12 days, how many days will 6 workers take?", Options: []string{"4 days", "6 days", "8 days", "10 days"}, CorrectAnswer: 0},
		{QuestionID: 8, Category: "Numerical", Question: "What is the average of 10, 20, 30, 40, and 50?", Options: []string{"25", "30", "35", "40"}, CorrectAnswer: 1},
		{QuestionID: 9, Category: "Numerical", Question: "A square has an area of 64 sq m. What is its perimeter?", Options: []string{"16 m", "24 m", "32 m", "48 m"}, CorrectAnswer: 2},
		{QuestionID: 10, Category: "Numerical", Question: "If A = 2 and B = 3, what is A³ + B²?", Options: []string{"15", "16", "17", "18"}, CorrectAnswer: 2},
		{QuestionID: 11, Category: "Numerical", Question: "What percentage is 25 out of 200?", Options: []string{"10%", "12.5%", "15%", "20%"}, CorrectAnswer: 1},
		{QuestionID: 12, Category: "Numerical", Question: "A shop had 100 items. 30% were sold. How many remain?", Options: []string{"50", "60", "70", "80"}, CorrectAnswer: 2},

		{QuestionID: 13, Category: "Verbal", Question: "Antonym of 'Abundant':", Options: []string{"Scarce", "Plenty", "Rich", "Plentiful"}, CorrectAnswer: 0},
		{QuestionID: 14, Category: "Verbal", Question: "Synonym of 'Erudite':", Options: []string{"Ignorant", "Learned", "Stubborn", "Arrogant"}, CorrectAnswer: 1},
		{QuestionID: 15, Category: "Verbal", Question: "Complete the analogy: Bird is to Feather as Fish is to ___", Options: []string{"Scale", "Gill", "Water", "Swim"}, CorrectAnswer: 0},
		{QuestionID: 16, Category: "Verbal", Question: "Which word does NOT belong? Apple, Banana, Carrot, Orange", Options: []string{"Apple", "Banana", "Carrot", "Orange"}, CorrectAnswer: 2},
		{QuestionID: 17, Category: "Verbal", Question: "Antonym of 'Fragile':", Options: []string{"Weak", "Strong", "Delicate", "Brittle"}, CorrectAnswer: 1},
		{QuestionID: 18, Category: "Verbal", Question: "What is the meaning of 'Benevolent'?", Options: []string{"Cruel", "Generous", "Selfish", "Unkind"}, CorrectAnswer: 1},
		{QuestionID: 19, Category: "Verbal", Question: "Complete the analogy: Book is to Author as Painting is to ___", Options: []string{"Gallery", "Artist", "Canvas", "Color"}, CorrectAnswer: 1},
		{QuestionID: 20, Category: "Verbal", Question: "Which word is spelled correctly?", Options: []string{"Occurance", "Occurence", "Occurrence", "Occurance"}, CorrectAnswer: 2},
		{QuestionID: 21, Category: "Verbal", Question: "Synonym of 'Meticulous':", Options: []string{"Careless", "Careful", "Slow", "Detailed"}, CorrectAnswer: 3},
		{QuestionID: 22, Category: "Verbal", Question: "Antonym of 'Optimistic':", Options: []string{"Pessimistic", "Realistic", "Hopeful", "Positive"}, CorrectAnswer: 0},
		{QuestionID: 23, Category: "Verbal", Question: "What does 'Ephemeral' mean?", Options: []string{"Permanent", "Temporary", "Eternal", "Lasting"}, CorrectAnswer: 1},
		{QuestionID: 24, Category: "Verbal", Question: "Complete: 'He was so exhausted that he _____ on the couch.'", Options: []string{"Lied", "Laid", "Lay", "Lain"}, CorrectAnswer: 2},

		{QuestionID: 25, Category: "Logical", Question: "If all dogs are animals, and all animals eat food, then dogs eat food. This is:", Options: []string{"Invalid", "Valid", "Uncertain", "Paradoxical"}, CorrectAnswer: 1},
		{QuestionID: 26, Category: "Logical", Question: "Which number comes next in the series: 2, 4, 8, 16, ___?", Options: []string{"24", "32", "40", "48"}, CorrectAnswer: 1},
		{QuestionID: 27, Category: "Logical", Question: "If A > B and B > C, then A > C. This principle is called:", Options: []string{"Contradiction", "Transitivity", "Negation", "Induction"}, CorrectAnswer: 1},
		{QuestionID: 28, Category: "Logical", Question: "Which pattern comes next?       ___?", Options: []string{"", "", "", ""}, CorrectAnswer: 0},
		{QuestionID: 29, Category: "Logical", Question: "If John is taller than Mike, and Mike is taller than Lisa, who is the shortest?", Options: []string{"John", "Mike", "Lisa", "Cannot determine"}, CorrectAnswer: 2},
		{QuestionID: 30, Category: "Logical", Question: "Which letter comes next: A, C, E, G, ___?", Options: []string{"H", "I", "J", "K"}, CorrectAnswer: 2},
		{QuestionID: 31, Category: "Logical", Question: "Complete the series: 1, 1, 2, 3, 5, 8, ___", Options: []string{"11", "12", "13", "14"}, CorrectAnswer: 2},
		{QuestionID: 32, Category: "Logical", Question: "If X means +, Y means -, Z means ×, what is 5 X 3 Z 2?", Options: []string{"13", "14", "15", "16"}, CorrectAnswer: 3},
		{QuestionID: 33, Category: "Logical", Question: "Which shape is different? Triangle, Square, Pentagon, Cube", Options: []string{"Triangle", "Square", "Pentagon", "Cube"}, CorrectAnswer: 3},
		{QuestionID: 34, Category: "Logical", Question: "If all are cats and some cats are black, then definitely:", Options: []string{"Some black are cats", "All black are cats", "No cats are black", "Cannot determine"}, CorrectAnswer: 0},
		{QuestionID: 35, Category: "Logical", Question: "What comes next: 2, 6, 12, 20, ___?", Options: []string{"28", "30", "32", "36"}, CorrectAnswer: 1},
		{QuestionID: 36, Category: "Logical", Question: "If ROSE is coded as 6954, then RICE is coded as:", Options: []string{"6940", "6954", "6492", "6549"}, CorrectAnswer: 2},

		{QuestionID: 37, Category: "Abstract", Question: "Which figure is different from the rest?", Options: []string{"A", "B", "C", "D"}, CorrectAnswer: 2},
		{QuestionID: 38, Category: "Abstract", Question: "Find the missing number in the matrix: 3, 9, 27 / 2, 6, 18 / 4, __, 36", Options: []string{"10", "12", "14", "16"}, CorrectAnswer: 1},
		{QuestionID: 39, Category: "Abstract", Question: "What is the next figure in the sequence?", Options: []string{"A", "B", "C", "D"}, CorrectAnswer: 0},
		{QuestionID: 40, Category: "Abstract", Question: "Odd one out: Circle, Square, Triangle, Water", Options: []string{"Circle", "Square", "Triangle", "Water"}, CorrectAnswer: 3},
		{QuestionID: 41, Category: "Abstract", Question: "Which pattern completes the grid?", Options: []string{"A", "B", "C", "D"}, CorrectAnswer: 1},
		{QuestionID: 42, Category: "Abstract", Question: "What is the position of the missing piece?", Options: []string{"Top", "Right", "Bottom", "Left"}, CorrectAnswer: 2},
		{QuestionID: 43, Category: "Abstract", Question: "Which shape is the odd one?", Options: []string{"Pentagon", "Hexagon", "Octagon", "Semicircle"}, CorrectAnswer: 3},
		{QuestionID: 44, Category: "Abstract", Question: "Complete the pattern:    ___", Options: []string{"", "", "", ""}, CorrectAnswer: 1},
		{QuestionID: 45, Category: "Abstract", Question: "Which piece fits the empty space?", Options: []string{"A", "B", "C", "D"}, CorrectAnswer: 0},
		{QuestionID: 46, Category: "Abstract", Question: "What replaces the question mark?", Options: []string{"3", "4", "5", "6"}, CorrectAnswer: 1},
		{QuestionID: 47, Category: "Abstract", Question: "Find the pattern and choose the next:", Options: []string{"A", "B", "C", "D"}, CorrectAnswer: 2},
		{QuestionID: 48, Category: "Abstract", Question: "The odd figure is:", Options: []string{"A", "B", "C", "D"}, CorrectAnswer: 3},

		{QuestionID: 49, Category: "Spatial", Question: "If a cube is rotated, which face is opposite to the top?", Options: []string{"Bottom", "Left", "Right", "Front"}, CorrectAnswer: 0},
		{QuestionID: 50, Category: "Spatial", Question: "How many faces does a rectangular pyramid have?", Options: []string{"4", "5", "6", "7"}, CorrectAnswer: 1},
		{QuestionID: 51, Category: "Spatial", Question: "Which direction is opposite to North-East?", Options: []string{"South-West", "South-East", "North-West", "West"}, CorrectAnswer: 0},
		{QuestionID: 52, Category: "Spatial", Question: "If I face North and turn 90 clockwise, I face:", Options: []string{"South", "East", "West", "South-East"}, CorrectAnswer: 1},
		{QuestionID: 53, Category: "Spatial", Question: "How many cubes are in this structure?", Options: []string{"5", "6", "7", "8"}, CorrectAnswer: 1},
		{QuestionID: 54, Category: "Spatial", Question: "If you fold this net, which faces will be adjacent to the top face?", Options: []string{"All except bottom", "Left, Right, Front", "Front, Back, Right", "All except one"}, CorrectAnswer: 0},
		{QuestionID: 55, Category: "Spatial", Question: "What is the mirror image of the given figure?", Options: []string{"A", "B", "C", "D"}, CorrectAnswer: 1},
		{QuestionID: 56, Category: "Spatial", Question: "How many vertices does a triangular prism have?", Options: []string{"4", "6", "8", "10"}, CorrectAnswer: 1},
		{QuestionID: 57, Category: "Spatial", Question: "If I'm facing South and turn 45 counter-clockwise, I face:", Options: []string{"South-East", "South-West", "North-West", "East"}, CorrectAnswer: 1},
		{QuestionID: 58, Category: "Spatial", Question: "Which shape, when rotated 180, looks the same?", Options: []string{"Triangle", "Square", "Pentagon", "Hexagon"}, CorrectAnswer: 1},
		{QuestionID: 59, Category: "Spatial", Question: "How many edges does a cube have?", Options: []string{"8", "10", "12", "14"}, CorrectAnswer: 2},
		{QuestionID: 60, Category: "Spatial", Question: "What is the next figure in the 3D rotation sequence?", Options: []string{"A", "B", "C", "D"}, CorrectAnswer: 0},
	}
}

func (s *CognitiveService) RegisterForTest(userID, email string, req models.CognitiveTestRegistrationRequest) error {
	ctx := context.Background()

	var existing models.CognitiveTestRegistration
	err := cognitiveRegistrationCollection.FindOne(ctx, bson.M{
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

	if user.Age >= 18 {
		return errors.New("you must be under 18 years old to take the Cognitive test")
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
		studentType = "high_school"
	}

	registration := models.CognitiveTestRegistration{
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

	_, err = cognitiveRegistrationCollection.InsertOne(ctx, registration)
	return err
}

func (s *CognitiveService) GetUserRegistration(userID string) (*models.CognitiveTestRegistration, error) {
	ctx := context.Background()
	var registration models.CognitiveTestRegistration

	err := cognitiveRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
	}).Decode(&registration)

	if err != nil {
		return nil, err
	}

	return &registration, nil
}

func (s *CognitiveService) GetAllRegistrations(status string) ([]models.CognitiveTestRegistration, error) {
	ctx := context.Background()
	var registrations []models.CognitiveTestRegistration

	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}

	cursor, err := cognitiveRegistrationCollection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &registrations); err != nil {
		return nil, err
	}

	return registrations, nil
}

func (s *CognitiveService) ApproveRegistration(registrationID, adminEmail string) error {
	ctx := context.Background()

	var registration models.CognitiveTestRegistration
	err := cognitiveRegistrationCollection.FindOne(ctx, bson.M{"_id": registrationID}).Decode(&registration)
	if err != nil {
		return err
	}

	_, err = cognitiveRegistrationCollection.UpdateOne(
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

	realtime.BroadcastCognitiveApproval(registration.UserID)

	return nil
}

func (s *CognitiveService) RejectRegistration(registrationID, reason string) error {
	ctx := context.Background()

	_, err := cognitiveRegistrationCollection.UpdateOne(
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

func (s *CognitiveService) SubmitTest(userID, email string, req models.CognitiveTestSubmitRequest) (*models.CognitiveTestResult, error) {
	ctx := context.Background()

	var registration models.CognitiveTestRegistration
	err := cognitiveRegistrationCollection.FindOne(ctx, bson.M{
		"user_id": userID,
		"status":  "approved",
	}).Decode(&registration)

	if err != nil {
		return nil, errors.New("you must have an approved registration to take the test")
	}

	var existing models.CognitiveTestResult
	err = cognitiveResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&existing)

	if err == nil {
		return nil, errors.New("you have already completed this test")
	}

	questions := s.GetCognitiveQuestions()
	questionMap := make(map[int]models.CognitiveTestQuestion)
	for _, q := range questions {
		questionMap[q.QuestionID] = q
	}

	var answers []models.CognitiveTestAnswer
	correctCount := 0
	categoryScores := map[string]int{
		"Numerical": 0,
		"Verbal":    0,
		"Logical":   0,
		"Abstract":  0,
		"Spatial":   0,
	}
	categoryTotal := map[string]int{
		"Numerical": 0,
		"Verbal":    0,
		"Logical":   0,
		"Abstract":  0,
		"Spatial":   0,
	}

	for _, ans := range req.Answers {
		question, exists := questionMap[ans.QuestionID]
		if !exists {
			return nil, fmt.Errorf("invalid question ID: %d", ans.QuestionID)
		}

		isCorrect := false
		if ans.SelectedOption == question.CorrectAnswer {
			correctCount++
			isCorrect = true
			categoryScores[question.Category]++
		}
		categoryTotal[question.Category]++

		answers = append(answers, models.CognitiveTestAnswer{
			QuestionID:     ans.QuestionID,
			Question:       question.Question,
			SelectedOption: ans.SelectedOption,
			CorrectOption:  question.CorrectAnswer,
			IsCorrect:      isCorrect,
		})
	}

	totalScore := (correctCount * 100) / 60
	numericalPercentage := (categoryScores["Numerical"] * 100) / categoryTotal["Numerical"]
	verbalPercentage := (categoryScores["Verbal"] * 100) / categoryTotal["Verbal"]
	logicalPercentage := (categoryScores["Logical"] * 100) / categoryTotal["Logical"]
	abstractPercentage := (categoryScores["Abstract"] * 100) / categoryTotal["Abstract"]
	spatialPercentage := (categoryScores["Spatial"] * 100) / categoryTotal["Spatial"]

	interpretation := s.getCognitiveInterpretation(totalScore)

	result := models.CognitiveTestResult{
		ID:                  primitive.NewObjectID().Hex(),
		UserID:              userID,
		Email:               email,
		Name:                registration.Name,
		Age:                 registration.Age,
		StudentType:         registration.StudentType,
		Answers:             answers,
		CorrectAnswers:      correctCount,
		TotalQuestions:      60,
		TotalScore:          totalScore,
		NumericalScore:      categoryScores["Numerical"],
		NumericalPercentage: numericalPercentage,
		VerbalScore:         categoryScores["Verbal"],
		VerbalPercentage:    verbalPercentage,
		LogicalScore:        categoryScores["Logical"],
		LogicalPercentage:   logicalPercentage,
		AbstractScore:       categoryScores["Abstract"],
		AbstractPercentage:  abstractPercentage,
		SpatialScore:        categoryScores["Spatial"],
		SpatialPercentage:   spatialPercentage,
		Interpretation:      interpretation,
		TotalTimeSpent:      req.TotalTimeSpent,
		IsCompleted:         true,
		CompletedAt:         time.Now(),
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	_, err = cognitiveResultCollection.InsertOne(ctx, result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *CognitiveService) getCognitiveInterpretation(score int) string {
	if score >= 85 {
		return "Exceptional cognitive abilities. You demonstrate excellent reasoning, problem-solving, and analytical skills across all areas."
	} else if score >= 70 {
		return "Strong cognitive abilities. You show good performance in reasoning, comprehension, and problem-solving with room for minor improvements."
	} else if score >= 55 {
		return "Average cognitive abilities. Your reasoning and problem-solving skills are at a typical level with some areas for development."
	} else if score >= 40 {
		return "Below average performance. You may benefit from focused practice in reasoning, comprehension, and problem-solving skills."
	}
	return "Significant challenges identified. Consider seeking additional support in cognitive skill development and problem-solving."
}

func (s *CognitiveService) GetUserResult(userID string) (*models.CognitiveTestResult, error) {
	ctx := context.Background()
	var result models.CognitiveTestResult

	err := cognitiveResultCollection.FindOne(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	}).Decode(&result)

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *CognitiveService) GetAllResults() ([]models.CognitiveTestResult, error) {
	ctx := context.Background()
	var results []models.CognitiveTestResult

	cursor, err := cognitiveResultCollection.Find(ctx, bson.M{"is_completed": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	return results, nil
}

func (s *CognitiveService) GetResultByID(resultID string) (*models.CognitiveTestResult, error) {
	ctx := context.Background()
	var result models.CognitiveTestResult

	err := cognitiveResultCollection.FindOne(ctx, bson.M{"_id": resultID}).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("test result not found")
		}
		return nil, err
	}

	return &result, nil
}
