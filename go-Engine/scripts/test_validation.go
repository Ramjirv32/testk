package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type ValidationRequest struct {
	CollegeName string `json:"college_name"`
	Country     string `json:"country"`
	Location    string `json:"location"`
}

type ValidationResponse struct {
	IsValid  bool   `json:"is_valid"`
	Name     string `json:"name"`
	Country  string `json:"country"`
	Location string `json:"location"`
	Error    string `json:"error,omitempty"`
	Reason   string `json:"reason,omitempty"`
}

func testValidation(collegeName, country, location string) {
	fmt.Printf("\n Testing: %s (Country: %s, Location: %s)\n", collegeName, country, location)
	fmt.Println(strings.Repeat("-", 70))

	req := ValidationRequest{
		CollegeName: collegeName,
		Country:     country,
		Location:    location,
	}

	body, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", "http://localhost:8080/api/college/validate", bytes.NewBuffer(body))
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		fmt.Printf(" Request failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var validationResp ValidationResponse
	json.Unmarshal(respBody, &validationResp)

	if validationResp.IsValid {
		fmt.Printf(" VALID: %s\n", validationResp.Name)
		fmt.Printf("   Country:  %s\n", validationResp.Country)
		fmt.Printf("   Location: %s\n", validationResp.Location)
	} else {
		fmt.Printf(" INVALID: %s\n", validationResp.Error)
		fmt.Printf("   Reason: %s\n", validationResp.Reason)
	}
}

func main() {
	fmt.Println(" College Name Validation Test Suite")
	fmt.Println(strings.Repeat("=", 70))

	// Test cases
	testCases := []struct {
		name     string
		country  string
		location string
	}{
		// Partial/Abbreviated names
		{"PSG", "India", "Tamil Nadu"},
		{"NUS", "Singapore", "Singapore"},
		{"IIT", "India", "Chennai"},
		{"MIT", "USA", "Massachusetts"},
		{"Oxford", "UK", "Oxford"},

		// Full names (should work)
		{"PSG College of Technology", "India", "Coimbatore"},
		{"National University of Singapore", "Singapore", "Singapore"},
		{"Indian Institute of Technology Madras", "India", "Chennai"},
		{"Massachusetts Institute of Technology", "USA", "Cambridge"},

		// Non-existent colleges
		{"XYZ College", "India", "Mumbai"},
		{"Fake University", "Unknown", ""},
	}

	for _, tc := range testCases {
		testValidation(tc.name, tc.country, tc.location)
		time.Sleep(1 * time.Second)
	}

	fmt.Println("\n" + strings.Repeat("=", 70))
	fmt.Println(" Test Suite Complete")
}
