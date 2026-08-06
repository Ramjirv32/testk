package authsvc

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"gobackend/config"
	"gobackend/models"

	"gobackend/services/messaging"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	emailService *messaging.EmailService
}

func NewAuthService() *AuthService {
	return &AuthService{
		emailService: messaging.NewEmailService(),
	}
}

func GenerateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func GenerateJWT(user *models.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", errors.New("JWT_SECRET not set")
	}

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ValidateJWT(tokenString string) (*jwt.MapClaims, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, errors.New("JWT_SECRET not set")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return &claims, nil
	}

	return nil, errors.New("invalid token")
}

func (a *AuthService) Signup(name, email, password, dateOfBirth string) (*models.User, error) {
	var existingUser models.User
	err := config.UserCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		return nil, errors.New("user already exists")
	}

	dob, err := time.Parse("2006-01-02", dateOfBirth)
	if err != nil {
		return nil, fmt.Errorf("invalid date of birth format. Use YYYY-MM-DD: %w", err)
	}

	now := time.Now()
	age := now.Year() - dob.Year()
	if now.YearDay() < dob.YearDay() {
		age--
	}

	if age < 5 {
		return nil, errors.New("user must be at least 5 years old")
	}

	studentType := "major"
	if age < 18 {
		studentType = "minor"
	}

	hashedPassword, err := HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	verificationToken, err := GenerateToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	userID := primitive.NewObjectID().Hex()
	user := &models.User{
		ID:                userID,
		Name:              name,
		Email:             email,
		Password:          hashedPassword,
		Role:              "user",
		DateOfBirth:       dob,
		Age:               age,
		StudentType:       studentType,
		IsVerified:        true,
		VerificationToken: verificationToken,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}

	_, err = config.UserCollection.InsertOne(context.TODO(), user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	studentDetails := &models.StudentDetails{
		ID:          primitive.NewObjectID().Hex(),
		UserID:      userID,
		Email:       email,
		DateOfBirth: dob,
		Age:         age,
		StudentType: studentType,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if studentType == "minor" {
		_, err = config.MinorStudentsCollection.InsertOne(context.TODO(), studentDetails)
		if err != nil {
			log.Printf(" Failed to insert into minor_students collection: %v", err)
		} else {
			log.Printf(" Minor student record created for: %s (Age: %d)", email, age)
		}
	} else {
		_, err = config.MajorStudentsCollection.InsertOne(context.TODO(), studentDetails)
		if err != nil {
			log.Printf(" Failed to insert into major_students collection: %v", err)
		} else {
			log.Printf(" Major student record created for: %s (Age: %d)", email, age)
		}
	}

	log.Printf(" User created: %s (Age: %d, Type: %s)", email, age, studentType)
	return user, nil
}

func (a *AuthService) Login(email, password string) (*models.User, string, error) {
	var user models.User
	err := config.UserCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	if !CheckPasswordHash(password, user.Password) {
		return nil, "", errors.New("invalid credentials")
	}

	config.UserCollection.UpdateOne(
		context.TODO(),
		bson.M{"email": email},
		bson.M{"$set": bson.M{"last_login": time.Now()}},
	)

	token, err := GenerateJWT(&user)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	log.Printf(" User logged in: %s", email)
	return &user, token, nil
}

func (a *AuthService) VerifyEmail(token string) error {
	var user models.User
	err := config.UserCollection.FindOne(context.TODO(), bson.M{
		"verification_token": token,
	}).Decode(&user)
	if err != nil {
		return errors.New("invalid verification token")
	}

	_, err = config.UserCollection.UpdateOne(
		context.TODO(),
		bson.M{"_id": user.ID},
		bson.M{
			"$set": bson.M{
				"is_verified":        true,
				"verification_token": "",
				"updated_at":         time.Now(),
			},
		},
	)
	if err != nil {
		return fmt.Errorf("failed to verify email: %w", err)
	}

	log.Printf(" Email verified: %s", user.Email)
	return nil
}

func (a *AuthService) ResendVerification(email string) error {
	var user models.User
	err := config.UserCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		return errors.New("user not found")
	}

	if user.IsVerified {
		return errors.New("email already verified")
	}

	verificationToken, err := GenerateToken()
	if err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}

	_, err = config.UserCollection.UpdateOne(
		context.TODO(),
		bson.M{"email": email},
		bson.M{"$set": bson.M{"verification_token": verificationToken}},
	)
	if err != nil {
		return fmt.Errorf("failed to update token: %w", err)
	}

	err = a.emailService.SendVerificationEmail(email, verificationToken)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf(" Verification email resent: %s", email)
	return nil
}

func GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := config.UserCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserByID(id string) (*models.User, error) {
	var user models.User
	err := config.UserCollection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func CreateAdminUser() error {
	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")

	if adminEmail == "" || adminPassword == "" {
		return errors.New("ADMIN_EMAIL or ADMIN_PASSWORD not set")
	}

	var existingAdmin models.User
	err := config.UserCollection.FindOne(context.TODO(), bson.M{"email": adminEmail}).Decode(&existingAdmin)
	if err == nil {
		log.Printf("ℹ️ Admin user already exists: %s", adminEmail)
		return nil
	}

	hashedPassword, err := HashPassword(adminPassword)
	if err != nil {
		return fmt.Errorf("failed to hash admin password: %w", err)
	}

	admin := &models.User{
		ID:         primitive.NewObjectID().Hex(),
		Email:      adminEmail,
		Password:   hashedPassword,
		Role:       "admin",
		IsVerified: true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	_, err = config.UserCollection.InsertOne(context.TODO(), admin)
	if err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	log.Printf(" Admin user created: %s", adminEmail)
	return nil
}

func GetAllUsers() ([]models.User, error) {
	var users []models.User
	cursor, err := config.UserCollection.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	if err = cursor.All(context.TODO(), &users); err != nil {
		return nil, err
	}

	return users, nil
}

func DeleteUser(email string) error {
	result, err := config.UserCollection.DeleteOne(context.TODO(), bson.M{"email": email})
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	if result.DeletedCount == 0 {
		return errors.New("user not found")
	}

	log.Printf(" User deleted: %s", email)
	return nil
}
