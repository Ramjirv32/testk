package models

import "time"

const DefaultQSScraperSettingsID = "default"
const DefaultQSDirectorySettingsID = "directory"

type QSScraperSettings struct {
	ID            string    `bson:"_id" json:"id"`
	BaseURL       string    `bson:"base_url" json:"base_url"`
	StartPage     int       `bson:"start_page" json:"start_page"`
	EndPage       int       `bson:"end_page" json:"end_page"`
	PagerLimit    int       `bson:"pager_limit" json:"pager_limit"`
	WaitMS        int       `bson:"wait_ms" json:"wait_ms"`
	PageTimeoutMS int       `bson:"page_timeout_ms" json:"page_timeout_ms"`
	CreatedAt     time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time `bson:"updated_at" json:"updated_at"`
}

func DefaultQSScraperSettings() QSScraperSettings {
	now := time.Now().UTC()
	return QSScraperSettings{
		ID:            DefaultQSScraperSettingsID,
		BaseURL:       "https://www.topuniversities.com/universities",
		StartPage:     1,
		EndPage:       300,
		PagerLimit:    25,
		WaitMS:        2500,
		PageTimeoutMS: 45000,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

func DefaultQSDirectorySettings() QSScraperSettings {
	now := time.Now().UTC()
	return QSScraperSettings{
		ID:            DefaultQSDirectorySettingsID,
		BaseURL:       "https://www.topuniversities.com/universities",
		StartPage:     1,
		EndPage:       300,
		PagerLimit:    25,
		WaitMS:        2500,
		PageTimeoutMS: 45000,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}
