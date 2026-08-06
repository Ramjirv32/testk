//go:build ignore
// +build ignore

package main

import (
	"fmt"
	"log"

	"gobackend/config"
	collegesvc "gobackend/services/college"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	if err := config.ConnectDatabase(); err != nil {
		log.Fatal("MongoDB connection failed:", err)
	}
	defer config.DisconnectDatabase()

	collegeName := "R.V. College of Engineering"
	log.Printf("Querying for: %q", collegeName)
	res, err := collegesvc.GetCollegeFromCache(collegeName)
	if err != nil {
		log.Fatalf("Error: %v", err)
	}
	fmt.Printf("Success! Found: %s\n", res.CollegeName)
}
