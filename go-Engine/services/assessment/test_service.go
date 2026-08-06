package assessmentsvc

import (
	"context"
	"fmt"
	"gobackend/config"
	"gobackend/models"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetMVTIQuestions() []models.TestQuestion {
	return []models.TestQuestion{
		{QuestionID: 1, Question: "At a party do you:", Options: []string{"Interact with many, including strangers", "Interact with a few, known to you"}, CorrectIndex: 0},
		{QuestionID: 2, Question: "Are you more:", Options: []string{"Realistic than speculative", "Speculative than realistic"}, CorrectIndex: 0},
		{QuestionID: 3, Question: "Is it worse to:", Options: []string{"Have your \"head in the clouds\"", "Be \"in a rut\""}, CorrectIndex: 0},
		{QuestionID: 4, Question: "Are you more impressed by:", Options: []string{"Principles", "Emotions"}, CorrectIndex: 0},
		{QuestionID: 5, Question: "Are more drawn toward the:", Options: []string{"Convincing", "Touching"}, CorrectIndex: 0},
		{QuestionID: 6, Question: "Do you prefer to work:", Options: []string{"To deadlines", "Just \"whenever\""}, CorrectIndex: 0},
		{QuestionID: 7, Question: "Do you tend to choose:", Options: []string{"Rather carefully", "Somewhat impulsively"}, CorrectIndex: 0},
		{QuestionID: 8, Question: "At parties do you:", Options: []string{"Stay late, with increasing energy", "Leave early with decreased energy"}, CorrectIndex: 0},
		{QuestionID: 9, Question: "Are you more attracted to:", Options: []string{"Sensible people", "Imaginative people"}, CorrectIndex: 0},
		{QuestionID: 10, Question: "Are you more interested in:", Options: []string{"What is actual", "What is possible"}, CorrectIndex: 0},
		{QuestionID: 11, Question: "In judging others are you more swayed by:", Options: []string{"Laws than circumstances", "Circumstances than laws"}, CorrectIndex: 0},
		{QuestionID: 12, Question: "In approaching others is your inclination to be somewhat:", Options: []string{"Objective", "Personal"}, CorrectIndex: 0},
		{QuestionID: 13, Question: "Are you more:", Options: []string{"Punctual", "Leisurely"}, CorrectIndex: 0},
		{QuestionID: 14, Question: "Does it bother you more having things:", Options: []string{"Incomplete", "Completed"}, CorrectIndex: 0},
		{QuestionID: 15, Question: "In your social groups do you:", Options: []string{"Keep abreast of other's happenings", "Get behind on the news"}, CorrectIndex: 0},
		{QuestionID: 16, Question: "In doing ordinary things are you more likely to:", Options: []string{"Do it the usual way", "Do it your own way"}, CorrectIndex: 0},
		{QuestionID: 17, Question: "Writers should:", Options: []string{"\"Say what they mean and mean what they say\"", "Express things more by use of analogy"}, CorrectIndex: 0},
		{QuestionID: 18, Question: "Which appeals to you more:", Options: []string{"Consistency of thought", "Harmonious human relationships"}, CorrectIndex: 0},
		{QuestionID: 19, Question: "Are you more comfortable in making:", Options: []string{"Logical judgments", "Value judgments"}, CorrectIndex: 0},
		{QuestionID: 20, Question: "Do you want things:", Options: []string{"Settled and decided", "Unsettled and undecided"}, CorrectIndex: 0},
		{QuestionID: 21, Question: "Would you say you are more:", Options: []string{"Serious and determined", "Easy-going"}, CorrectIndex: 0},
		{QuestionID: 22, Question: "In phoning do you:", Options: []string{"Rarely question that it will all be said", "Rehearse what you'll say"}, CorrectIndex: 0},
		{QuestionID: 23, Question: "Facts:", Options: []string{"\"Speak for themselves\"", "Illustrate principles"}, CorrectIndex: 0},
		{QuestionID: 24, Question: "Are visionaries:", Options: []string{"Somewhat annoying", "Rather fascinating"}, CorrectIndex: 0},
		{QuestionID: 25, Question: "Are you more often:", Options: []string{"A cool-headed person", "A warm-hearted person"}, CorrectIndex: 0},
		{QuestionID: 26, Question: "Is it worse to be:", Options: []string{"Unjust", "Merciless"}, CorrectIndex: 0},
		{QuestionID: 27, Question: "Should one usually let events occur:", Options: []string{"By careful selection and choice", "Randomly and by chance"}, CorrectIndex: 0},
		{QuestionID: 28, Question: "Do you feel better about:", Options: []string{"Having purchased", "Having the option to buy"}, CorrectIndex: 0},
		{QuestionID: 29, Question: "In company do you:", Options: []string{"Initiate conversation", "Wait to be approached"}, CorrectIndex: 0},
		{QuestionID: 30, Question: "Common sense is:", Options: []string{"Rarely questionable", "Frequently questionable"}, CorrectIndex: 0},
		{QuestionID: 31, Question: "Children often do not:", Options: []string{"Make themselves useful enough", "Exercise their fantasy enough"}, CorrectIndex: 0},
		{QuestionID: 32, Question: "In making decisions do you feel more comfortable with:", Options: []string{"Standards", "Feelings"}, CorrectIndex: 0},
		{QuestionID: 33, Question: "Are you more:", Options: []string{"Firm than gentle", "Gentle than firm"}, CorrectIndex: 0},
		{QuestionID: 34, Question: "Which is more admirable:", Options: []string{"The ability to organize and be methodical", "The ability to adapt and make do"}, CorrectIndex: 0},
		{QuestionID: 35, Question: "Do you put more value on:", Options: []string{"Infinite", "Open-minded"}, CorrectIndex: 0},
		{QuestionID: 36, Question: "Does new and non-routine interaction with others:", Options: []string{"Stimulate and energize you", "Tax your reserves"}, CorrectIndex: 0},
		{QuestionID: 37, Question: "Are you more frequently:", Options: []string{"A practical sort of person", "A fanciful sort of person"}, CorrectIndex: 0},
		{QuestionID: 38, Question: "Are you more likely to:", Options: []string{"See how others are useful", "See how others see"}, CorrectIndex: 0},
		{QuestionID: 39, Question: "Which is more satisfying:", Options: []string{"To discuss an issue thoroughly", "To arrive at agreement on an issue"}, CorrectIndex: 0},
		{QuestionID: 40, Question: "Which rules you more:", Options: []string{"Your head", "Your heart"}, CorrectIndex: 0},
		{QuestionID: 41, Question: "Are you more comfortable with work that is:", Options: []string{"Contracted", "Done on a casual basis"}, CorrectIndex: 0},
		{QuestionID: 42, Question: "Do you tend to look for:", Options: []string{"The orderly", "Whatever turns up"}, CorrectIndex: 0},
		{QuestionID: 43, Question: "Do you prefer:", Options: []string{"Many friends with brief contact", "A few friends with more lengthy contact"}, CorrectIndex: 0},
		{QuestionID: 44, Question: "Do you go more by:", Options: []string{"Facts", "Principles"}, CorrectIndex: 0},
		{QuestionID: 45, Question: "Are you more interested in:", Options: []string{"Production and distribution", "Design and research"}, CorrectIndex: 0},
		{QuestionID: 46, Question: "Which is more of a compliment:", Options: []string{"\"There is a very logical person.\"", "\"There is a very sentimental person.\""}, CorrectIndex: 0},
		{QuestionID: 47, Question: "Do you value in yourself more that you are:", Options: []string{"Unwavering", "Devoted"}, CorrectIndex: 0},
		{QuestionID: 48, Question: "Do you more often prefer the:", Options: []string{"Final and unalterable statement", "Tentative and preliminary statement"}, CorrectIndex: 0},
		{QuestionID: 49, Question: "Are you more comfortable:", Options: []string{"After a decision", "Before a decision"}, CorrectIndex: 0},
		{QuestionID: 50, Question: "Do you:", Options: []string{"Speak easily and at length with strangers", "Find little to say to strangers"}, CorrectIndex: 0},
		{QuestionID: 51, Question: "Are you more likely to trust your:", Options: []string{"Experience", "Hunch"}, CorrectIndex: 0},
		{QuestionID: 52, Question: "Do you feel:", Options: []string{"More practical than ingenious", "More ingenious than practical"}, CorrectIndex: 0},
		{QuestionID: 53, Question: "Which person is more to be complimented – one of:", Options: []string{"Clear reason", "Strong feeling"}, CorrectIndex: 0},
		{QuestionID: 54, Question: "Are you inclined more to be:", Options: []string{"Fair-minded", "Sympathetic"}, CorrectIndex: 0},
		{QuestionID: 55, Question: "Is it preferable mostly to:", Options: []string{"Make sure things are arranged", "Just let things happen"}, CorrectIndex: 0},
		{QuestionID: 56, Question: "In relationships should most things be:", Options: []string{"Re-negotiable", "Random and circumstantial"}, CorrectIndex: 0},
		{QuestionID: 57, Question: "When the phone rings do you:", Options: []string{"Hasten to get to it first", "Hope someone else will answer"}, CorrectIndex: 0},
		{QuestionID: 58, Question: "Do you prize more in yourself:", Options: []string{"A strong sense of reality", "A vivid imagination"}, CorrectIndex: 0},
		{QuestionID: 59, Question: "Are you drawn more to:", Options: []string{"Fundamentals", "Overtones"}, CorrectIndex: 0},
		{QuestionID: 60, Question: "Which seems the greater error:", Options: []string{"To be too passionate", "To be too objective"}, CorrectIndex: 0},
		{QuestionID: 61, Question: "Do you see yourself as basically:", Options: []string{"Hard-headed", "Soft-hearted"}, CorrectIndex: 0},
		{QuestionID: 62, Question: "Which situation appeals to you more:", Options: []string{"The structured and scheduled", "The unstructured and unscheduled"}, CorrectIndex: 0},
		{QuestionID: 63, Question: "Are you a person that is more:", Options: []string{"Routinized than whimsical", "Whimsical than routinized"}, CorrectIndex: 0},
		{QuestionID: 64, Question: "Are you more inclined to be:", Options: []string{"Easy to approach", "Somewhat reserved"}, CorrectIndex: 0},
		{QuestionID: 65, Question: "In writings do you prefer:", Options: []string{"The more literal", "The more figurative"}, CorrectIndex: 0},
		{QuestionID: 66, Question: "Is it harder for you to:", Options: []string{"Identify with others", "Utilize others"}, CorrectIndex: 0},
		{QuestionID: 67, Question: "Which do you wish more for yourself:", Options: []string{"Clarity of reason", "Strength of compassion"}, CorrectIndex: 0},
		{QuestionID: 68, Question: "Which is the greater fault:", Options: []string{"Being indiscriminate", "Being critical"}, CorrectIndex: 0},
		{QuestionID: 69, Question: "Do you prefer the:", Options: []string{"Planned event", "Unplanned event"}, CorrectIndex: 0},
		{QuestionID: 70, Question: "Do you tend to be more:", Options: []string{"Deliberate than spontaneous", "Spontaneous than deliberate"}, CorrectIndex: 0},
	}
}

func GetCognitiveQuestions() []models.TestQuestion {
	return []models.TestQuestion{
		{QuestionID: 1, Question: "What is 15 + 27?", Options: []string{"40", "42", "43", "45"}, CorrectIndex: 1},
		{QuestionID: 2, Question: "Which word is the odd one out: Apple, Banana, Carrot, Orange?", Options: []string{"Apple", "Banana", "Carrot", "Orange"}, CorrectIndex: 2},
		{QuestionID: 3, Question: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?", Options: []string{"Yes", "No", "Maybe", "Cannot determine"}, CorrectIndex: 0},
		{QuestionID: 4, Question: "What comes next in the sequence: 2, 4, 8, 16, __?", Options: []string{"20", "24", "32", "64"}, CorrectIndex: 2},
		{QuestionID: 5, Question: "How many sides does a hexagon have?", Options: []string{"5", "6", "7", "8"}, CorrectIndex: 1},
		{QuestionID: 6, Question: "What is the capital of France?", Options: []string{"London", "Berlin", "Paris", "Madrid"}, CorrectIndex: 2},
		{QuestionID: 7, Question: "Which number is prime: 15, 17, 18, 20?", Options: []string{"15", "17", "18", "20"}, CorrectIndex: 1},
		{QuestionID: 8, Question: "Complete the analogy: Book is to Reading as Fork is to __?", Options: []string{"Writing", "Eating", "Cooking", "Cleaning"}, CorrectIndex: 1},
		{QuestionID: 9, Question: "What is 12 × 8?", Options: []string{"84", "92", "96", "104"}, CorrectIndex: 2},
		{QuestionID: 10, Question: "Which planet is known as the Red Planet?", Options: []string{"Venus", "Mars", "Jupiter", "Saturn"}, CorrectIndex: 1},
		{QuestionID: 11, Question: "If a train travels 60 miles in 1 hour, how far will it travel in 3 hours?", Options: []string{"120 miles", "150 miles", "180 miles", "200 miles"}, CorrectIndex: 2},
		{QuestionID: 12, Question: "What is the square root of 144?", Options: []string{"10", "11", "12", "13"}, CorrectIndex: 2},
		{QuestionID: 13, Question: "Which is the largest ocean on Earth?", Options: []string{"Atlantic", "Indian", "Arctic", "Pacific"}, CorrectIndex: 3},
		{QuestionID: 14, Question: "What is 25% of 200?", Options: []string{"25", "50", "75", "100"}, CorrectIndex: 1},
		{QuestionID: 15, Question: "How many minutes are in 2.5 hours?", Options: []string{"120", "130", "140", "150"}, CorrectIndex: 3},
		{QuestionID: 16, Question: "Which element has the chemical symbol 'O'?", Options: []string{"Gold", "Oxygen", "Silver", "Iron"}, CorrectIndex: 1},
		{QuestionID: 17, Question: "What is the next number: 1, 1, 2, 3, 5, 8, __?", Options: []string{"11", "12", "13", "14"}, CorrectIndex: 2},
		{QuestionID: 18, Question: "How many continents are there?", Options: []string{"5", "6", "7", "8"}, CorrectIndex: 2},
		{QuestionID: 19, Question: "What is 100 - 37?", Options: []string{"53", "63", "73", "83"}, CorrectIndex: 1},
		{QuestionID: 20, Question: "Which is the smallest prime number?", Options: []string{"0", "1", "2", "3"}, CorrectIndex: 2},

		{QuestionID: 21, Question: "What is 7 × 9?", Options: []string{"56", "63", "72", "81"}, CorrectIndex: 1},
		{QuestionID: 22, Question: "Which shape has 8 sides?", Options: []string{"Hexagon", "Heptagon", "Octagon", "Nonagon"}, CorrectIndex: 2},
		{QuestionID: 23, Question: "What is 144 ÷ 12?", Options: []string{"10", "11", "12", "13"}, CorrectIndex: 2},
		{QuestionID: 24, Question: "If 5x = 35, what is x?", Options: []string{"5", "6", "7", "8"}, CorrectIndex: 2},
		{QuestionID: 25, Question: "What comes next: A, C, E, G, __?", Options: []string{"H", "I", "J", "K"}, CorrectIndex: 1},
		{QuestionID: 26, Question: "How many degrees in a right angle?", Options: []string{"45", "60", "90", "180"}, CorrectIndex: 2},
		{QuestionID: 27, Question: "What is 50% of 80?", Options: []string{"30", "35", "40", "45"}, CorrectIndex: 2},
		{QuestionID: 28, Question: "Which is larger: 3/4 or 2/3?", Options: []string{"3/4", "2/3", "Equal", "Cannot compare"}, CorrectIndex: 0},
		{QuestionID: 29, Question: "What is the next prime after 7?", Options: []string{"8", "9", "10", "11"}, CorrectIndex: 3},
		{QuestionID: 30, Question: "How many hours in 3 days?", Options: []string{"48", "60", "72", "84"}, CorrectIndex: 2},
		{QuestionID: 31, Question: "What is 2³ (2 cubed)?", Options: []string{"4", "6", "8", "9"}, CorrectIndex: 2},
		{QuestionID: 32, Question: "Which number is divisible by 3: 47, 51, 53, 57?", Options: []string{"47", "51", "53", "57"}, CorrectIndex: 1},
		{QuestionID: 33, Question: "What is the perimeter of a square with side 5?", Options: []string{"10", "15", "20", "25"}, CorrectIndex: 2},
		{QuestionID: 34, Question: "If today is Wednesday, what day is it in 10 days?", Options: []string{"Thursday", "Friday", "Saturday", "Sunday"}, CorrectIndex: 2},
		{QuestionID: 35, Question: "What is 15% of 100?", Options: []string{"10", "15", "20", "25"}, CorrectIndex: 1},
		{QuestionID: 36, Question: "How many sides does a triangle have?", Options: []string{"2", "3", "4", "5"}, CorrectIndex: 1},
		{QuestionID: 37, Question: "What is 9 + 6 × 2?", Options: []string{"21", "30", "18", "24"}, CorrectIndex: 0},
		{QuestionID: 38, Question: "Which is the longest river in the world?", Options: []string{"Amazon", "Nile", "Yangtze", "Mississippi"}, CorrectIndex: 1},
		{QuestionID: 39, Question: "What is 64 ÷ 8?", Options: []string{"6", "7", "8", "9"}, CorrectIndex: 2},
		{QuestionID: 40, Question: "How many months have 31 days?", Options: []string{"5", "6", "7", "8"}, CorrectIndex: 2},

		{QuestionID: 41, Question: "What is the square of 9?", Options: []string{"18", "27", "81", "72"}, CorrectIndex: 2},
		{QuestionID: 42, Question: "Which planet is closest to the Sun?", Options: []string{"Venus", "Earth", "Mercury", "Mars"}, CorrectIndex: 2},
		{QuestionID: 43, Question: "What is 20% of 50?", Options: []string{"5", "10", "15", "20"}, CorrectIndex: 1},
		{QuestionID: 44, Question: "How many seconds in 2 minutes?", Options: []string{"60", "90", "120", "150"}, CorrectIndex: 2},
		{QuestionID: 45, Question: "What comes next: 3, 6, 12, 24, __?", Options: []string{"36", "48", "40", "32"}, CorrectIndex: 1},
		{QuestionID: 46, Question: "Which is the smallest: 0.5, 0.05, 0.005, 0.55?", Options: []string{"0.5", "0.05", "0.005", "0.55"}, CorrectIndex: 2},
		{QuestionID: 47, Question: "What is 11 × 11?", Options: []string{"111", "121", "112", "122"}, CorrectIndex: 1},
		{QuestionID: 48, Question: "How many vowels are in the English alphabet?", Options: []string{"4", "5", "6", "7"}, CorrectIndex: 1},
		{QuestionID: 49, Question: "What is the capital of Japan?", Options: []string{"Seoul", "Beijing", "Tokyo", "Bangkok"}, CorrectIndex: 2},
		{QuestionID: 50, Question: "If a dozen eggs cost $12, how much does one egg cost?", Options: []string{"$0.50", "$1", "$1.50", "$2"}, CorrectIndex: 1},
		{QuestionID: 51, Question: "What is 75 + 25?", Options: []string{"90", "95", "100", "105"}, CorrectIndex: 2},
		{QuestionID: 52, Question: "Which number comes next: 5, 10, 20, 40, __?", Options: []string{"60", "70", "80", "90"}, CorrectIndex: 2},
		{QuestionID: 53, Question: "How many days in a leap year?", Options: []string{"364", "365", "366", "367"}, CorrectIndex: 2},
		{QuestionID: 54, Question: "What is the freezing point of water in Celsius?", Options: []string{"-10C", "0C", "10C", "32C"}, CorrectIndex: 1},
		{QuestionID: 55, Question: "Which is heavier: 1kg of iron or 1kg of feathers?", Options: []string{"Iron", "Feathers", "Equal", "Cannot determine"}, CorrectIndex: 2},
		{QuestionID: 56, Question: "What is 13 + 17?", Options: []string{"28", "29", "30", "31"}, CorrectIndex: 2},
		{QuestionID: 57, Question: "How many zeros in one million?", Options: []string{"4", "5", "6", "7"}, CorrectIndex: 2},
		{QuestionID: 58, Question: "What is half of 88?", Options: []string{"42", "43", "44", "45"}, CorrectIndex: 2},
		{QuestionID: 59, Question: "Which is the largest: 1/2, 1/3, 1/4, 1/5?", Options: []string{"1/2", "1/3", "1/4", "1/5"}, CorrectIndex: 0},
		{QuestionID: 60, Question: "What is 6 × 7?", Options: []string{"40", "42", "44", "48"}, CorrectIndex: 1},

		{QuestionID: 61, Question: "How many legs does a spider have?", Options: []string{"6", "8", "10", "12"}, CorrectIndex: 1},
		{QuestionID: 62, Question: "What is 99 - 33?", Options: []string{"64", "65", "66", "67"}, CorrectIndex: 2},
		{QuestionID: 63, Question: "Which is the odd one out: 2, 4, 6, 9?", Options: []string{"2", "4", "6", "9"}, CorrectIndex: 3},
		{QuestionID: 64, Question: "What is 10 × 10?", Options: []string{"10", "50", "100", "1000"}, CorrectIndex: 2},
		{QuestionID: 65, Question: "How many sides does a pentagon have?", Options: []string{"4", "5", "6", "7"}, CorrectIndex: 1},
		{QuestionID: 66, Question: "What is the boiling point of water in Celsius?", Options: []string{"50C", "75C", "100C", "150C"}, CorrectIndex: 2},
		{QuestionID: 67, Question: "Which is the smallest planet in our solar system?", Options: []string{"Mercury", "Mars", "Venus", "Earth"}, CorrectIndex: 0},
		{QuestionID: 68, Question: "What is 8 + 8 + 8?", Options: []string{"16", "20", "24", "28"}, CorrectIndex: 2},
		{QuestionID: 69, Question: "How many letters in the word 'ALPHABET'?", Options: []string{"6", "7", "8", "9"}, CorrectIndex: 2},
		{QuestionID: 70, Question: "What is 200 ÷ 4?", Options: []string{"40", "45", "50", "55"}, CorrectIndex: 2},
	}
}

func SubmitTest(userID, email string, testType models.TestType, age int, studentType string,
	answers []struct {
		QuestionID     int `json:"question_id"`
		SelectedOption int `json:"selected_option"`
	},
	questionInteractions map[int]models.QuestionInteraction,
	totalTimeSpent int) (*models.TestResult, error) {

	var questions []models.TestQuestion
	if testType == models.MVTITest {
		questions = GetMVTIQuestions()
	} else {
		questions = GetCognitiveQuestions()
	}

	var mbtiType string
	var userAnswers []models.UserAnswer
	totalScore := 0
	maxScore := len(questions)

	if testType == models.MVTITest {
		col1Questions := []int{1, 8, 15, 22, 29, 36, 43, 50, 57, 64}
		col2Questions := []int{2, 9, 16, 23, 30, 37, 44, 51, 58, 65}
		col3Questions := []int{3, 10, 17, 24, 31, 38, 45, 52, 59, 66}
		col4Questions := []int{4, 11, 18, 25, 32, 39, 46, 53, 60, 67}
		col5Questions := []int{5, 12, 19, 26, 33, 40, 47, 54, 61, 68}
		col6Questions := []int{6, 13, 20, 27, 34, 41, 48, 55, 62, 69}
		col7Questions := []int{7, 14, 21, 28, 35, 42, 49, 56, 63, 70}

		eCount, iCount := 0, 0
		sCount, nCount := 0, 0
		tCount, fCount := 0, 0
		jCount, pCount := 0, 0

		answerMap := make(map[int]int)
		for _, answer := range answers {
			answerMap[answer.QuestionID] = answer.SelectedOption
		}

		for _, qid := range col1Questions {
			if selectedOption, exists := answerMap[qid]; exists {
				if selectedOption == 0 {
					eCount++
				} else {
					iCount++
				}
			}
		}

		for _, qid := range col2Questions {
			if selectedOption, exists := answerMap[qid]; exists {
				if selectedOption == 0 {
					sCount++
				} else {
					nCount++
				}
			}
		}
		for _, qid := range col3Questions {
			if selectedOption, exists := answerMap[qid]; exists {
				if selectedOption == 0 {
					sCount++
				} else {
					nCount++
				}
			}
		}

		for _, qid := range col4Questions {
			if selectedOption, exists := answerMap[qid]; exists {
				if selectedOption == 0 {
					tCount++
				} else {
					fCount++
				}
			}
		}
		for _, qid := range col5Questions {
			if selectedOption, exists := answerMap[qid]; exists {
				if selectedOption == 0 {
					tCount++
				} else {
					fCount++
				}
			}
		}

		for _, qid := range col6Questions {
			if selectedOption, exists := answerMap[qid]; exists {
				if selectedOption == 0 {
					jCount++
				} else {
					pCount++
				}
			}
		}
		for _, qid := range col7Questions {
			if selectedOption, exists := answerMap[qid]; exists {
				if selectedOption == 0 {
					jCount++
				} else {
					pCount++
				}
			}
		}

		var dimension1, dimension2, dimension3, dimension4 string
		if eCount >= iCount {
			dimension1 = "E"
		} else {
			dimension1 = "I"
		}
		if sCount >= nCount {
			dimension2 = "S"
		} else {
			dimension2 = "N"
		}
		if tCount >= fCount {
			dimension3 = "T"
		} else {
			dimension3 = "F"
		}
		if jCount >= pCount {
			dimension4 = "J"
		} else {
			dimension4 = "P"
		}

		mbtiType = dimension1 + dimension2 + dimension3 + dimension4

		totalScore = len(answers)
		maxScore = len(questions)

		for _, answer := range answers {
			var question models.TestQuestion
			for _, q := range questions {
				if q.QuestionID == answer.QuestionID {
					question = q
					break
				}
			}

			userAnswers = append(userAnswers, models.UserAnswer{
				QuestionID:     answer.QuestionID,
				Question:       question.Question,
				SelectedOption: answer.SelectedOption,
				CorrectOption:  -1,
				IsCorrect:      true,
			})
		}
	} else {
		for _, answer := range answers {
			var question models.TestQuestion
			for _, q := range questions {
				if q.QuestionID == answer.QuestionID {
					question = q
					break
				}
			}

			isCorrect := answer.SelectedOption == question.CorrectIndex
			if isCorrect {
				totalScore++
			}

			userAnswers = append(userAnswers, models.UserAnswer{
				QuestionID:     answer.QuestionID,
				Question:       question.Question,
				SelectedOption: answer.SelectedOption,
				CorrectOption:  question.CorrectIndex,
				IsCorrect:      isCorrect,
			})
		}
	}

	percentage := (float64(totalScore) / float64(maxScore)) * 100

	bookmarkedCount := 0
	reviewedCount := 0
	hintsUsedCount := 0
	confidentAnswers := 0
	unsureAnswers := 0
	guessAnswers := 0

	for _, interaction := range questionInteractions {
		if interaction.IsBookmarked {
			bookmarkedCount++
		}
		if interaction.MarkedForReview {
			reviewedCount++
		}
		if interaction.HintUsed {
			hintsUsedCount++
		}
		switch interaction.ConfidenceLevel {
		case models.Confident:
			confidentAnswers++
		case models.Unsure:
			unsureAnswers++
		case models.Guess:
			guessAnswers++
		}
	}

	testResult := &models.TestResult{
		ID:                   primitive.NewObjectID().Hex(),
		UserID:               userID,
		Email:                email,
		TestType:             testType,
		MBTIType:             mbtiType,
		Age:                  age,
		StudentType:          studentType,
		Answers:              userAnswers,
		QuestionInteractions: questionInteractions,
		TotalScore:           totalScore,
		MaxScore:             maxScore,
		Percentage:           percentage,
		TotalTimeSpent:       totalTimeSpent,
		BookmarkedCount:      bookmarkedCount,
		ReviewedCount:        reviewedCount,
		HintsUsedCount:       hintsUsedCount,
		ConfidentAnswers:     confidentAnswers,
		UnsureAnswers:        unsureAnswers,
		GuessAnswers:         guessAnswers,
		IsCompleted:          true,
		CompletedAt:          time.Now(),
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	var collection *mongo.Collection
	if testType == models.MVTITest {
		collection = config.MVTITestResultsCollection
	} else {
		collection = config.CognitiveTestResultsCollection
	}

	_, err := collection.InsertOne(context.TODO(), testResult)
	if err != nil {
		return nil, fmt.Errorf("failed to store test result: %w", err)
	}

	if testType == models.MVTITest {
		log.Printf(" MBTI Test completed: %s - Type: %s (Score: %d/%d, %.2f%%, Bookmarks: %d, Reviewed: %d)",
			email, mbtiType, totalScore, maxScore, percentage, bookmarkedCount, reviewedCount)
	} else {
		log.Printf(" Cognitive Test completed: %s (Score: %d/%d, %.2f%%, Bookmarks: %d, Reviewed: %d)",
			email, totalScore, maxScore, percentage, bookmarkedCount, reviewedCount)
	}
	return testResult, nil
}

func GetUserTestResult(userID string, testType models.TestType) (*models.TestResult, error) {
	var collection *mongo.Collection
	if testType == models.MVTITest {
		collection = config.MVTITestResultsCollection
	} else {
		collection = config.CognitiveTestResultsCollection
	}

	var result models.TestResult
	err := collection.FindOne(context.TODO(), bson.M{"user_id": userID}).Decode(&result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}

func GetAllTestResults(testType models.TestType) ([]models.TestResult, error) {
	var collection *mongo.Collection
	if testType == models.MVTITest {
		collection = config.MVTITestResultsCollection
	} else {
		collection = config.CognitiveTestResultsCollection
	}

	var results []models.TestResult
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &results); err != nil {
		return nil, err
	}

	return results, nil
}

func CheckTestCompletion(userID string, testType models.TestType) (bool, error) {
	var collection *mongo.Collection
	if testType == models.MVTITest {
		collection = config.MVTITestResultsCollection
	} else {
		collection = config.CognitiveTestResultsCollection
	}

	count, err := collection.CountDocuments(context.TODO(), bson.M{"user_id": userID, "is_completed": true})
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func GetTestResultByID(resultID string, testType models.TestType) (*models.TestResult, error) {
	var collection *mongo.Collection
	if testType == models.MVTITest {
		collection = config.MVTITestResultsCollection
	} else {
		collection = config.CognitiveTestResultsCollection
	}

	var result models.TestResult
	err := collection.FindOne(context.TODO(), bson.M{"_id": resultID}).Decode(&result)
	if err != nil {
		return nil, err
	}

	return &result, nil
}
