package models

import "time"

type SearchAnalytics struct {
	CollegeName  string    `json:"college_name" bson:"college_name"`
	SearchCount  int       `json:"search_count" bson:"search_count"`
	LastSearched time.Time `json:"last_searched" bson:"last_searched"`
	Country      string    `json:"country" bson:"country"`
}
