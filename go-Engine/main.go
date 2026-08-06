package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"gobackend/config"
	"gobackend/routes"
	ai "gobackend/services/ai"
	authsvc "gobackend/services/auth"
	collegesvc "gobackend/services/college"
	"gobackend/services/messaging"
	qsrankingsvc "gobackend/services/qsranking"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println(" No .env file found, using environment variables")
	}

	ai.InitializeCache()
	log.Println(" Cache initialized (1 hour TTL)")

	port := os.Getenv("PORT")
	if port == "" {
		port = "7000"
	}

	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "development"
	}
	log.Println(" DEPLOY CHECK: VERSION = 2025-12-20-TEST-1")

	log.Printf(" Environment: %s\n", env)
	log.Printf(" Port: %s\n", port)

	aiServerURL := os.Getenv("AI_SERVER_URL")
	if aiServerURL == "" {
		aiServerURL = "http://localhost:5000"
	}
	log.Printf(" AI Server: %s\n", aiServerURL)

	// Log CORS security configuration
	log.Println(" CORS Security Configuration:")
	log.Println("   Local Development:")
	log.Println("    http://localhost:3000")
	log.Println("    http://localhost:3001")
	log.Println("    http://localhost:7000")
	log.Println("    http://localhost:9000")
	log.Println("    http://localhost:8501")
	log.Println("    http://127.0.0.1:3000")
	log.Println("    http://127.0.0.1:3001")
	log.Println("    http://127.0.0.1:7000")
	log.Println("    http://127.0.0.1:9000")
	log.Println("    http://127.0.0.1:8501")
	log.Println("   Production:")
	log.Println("    https://ai.cloudlab.works")
	log.Println("    https://tru.cloudlab.works")
	log.Println("    https://api.cloudlab.works")

	if err := config.ConnectDatabase(); err != nil {
		log.Fatal(" MongoDB connection failed:", err)
	}
	defer config.DisconnectDatabase()

	if err := config.ConnectRedis(); err != nil {
		log.Println(" Redis connection failed, continuing without Redis cache")
	} else {
		defer config.DisconnectRedis()
	}
	if err := collegesvc.InitDurableCollegePipeline(context.Background()); err != nil {
		log.Printf(" Durable college pipeline initialization failed: %v", err)
	} else {
		log.Println(" Durable college pipeline dispatcher and monitor started")
	}

	qsConfigCtx, qsConfigCancel := context.WithTimeout(context.Background(), 10*time.Second)
	if _, err := qsrankingsvc.EnsureSettings(qsConfigCtx); err != nil {
		log.Printf(" Failed to initialize QS scraper settings: %v", err)
	} else {
		log.Println(" QS scraper settings loaded from MongoDB")
	}
	qsConfigCancel()
	directoryConfigCtx, directoryConfigCancel := context.WithTimeout(context.Background(), 10*time.Second)
	if _, err := qsrankingsvc.EnsureDirectorySettings(directoryConfigCtx); err != nil {
		log.Printf(" Failed to initialize QS university directory settings: %v", err)
	} else {
		log.Println(" QS university directory settings loaded from MongoDB")
	}
	directoryConfigCancel()
	qsrankingsvc.StartAnnualScheduler(context.Background())

	if err := messaging.InitRabbitMQ(); err != nil {
		log.Printf(" RabbitMQ connection failed: %v", err)
	} else {
		defer messaging.CloseRabbitMQ()
		if err := messaging.StartCacheConsumer(); err != nil {
			log.Printf(" Failed to start cache consumer: %v", err)
		}
		if err := qsrankingsvc.StartProfileQueue(); err != nil {
			log.Printf(" Failed to start QS profile queue: %v", err)
		} else {
			log.Println(" QS profile RabbitMQ queue started (20 bounded workers across CDP pool)")
		}
	}

	if err := authsvc.CreateAdminUser(); err != nil {
		log.Printf(" Admin user creation: %v", err)
	}

	router := routes.SetupRoutes()

	log.Printf(" Go Server running on http://localhost:%s\n", port)
	log.Printf(" API Health Check: http://localhost:%s/api/health\n", port)
	log.Printf(" Admin Email: %s\n", os.Getenv("ADMIN_EMAIL"))

	if env == "production" {
		log.Printf(" Server started in production mode")
	} else {
		log.Printf(" Server started in development mode")
	}

	log.Fatal(http.ListenAndServe(":"+port, router))

}
