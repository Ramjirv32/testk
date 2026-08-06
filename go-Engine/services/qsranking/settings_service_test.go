package qsranking

import (
	"testing"

	"gobackend/models"
)

func TestDefaultSettingsAreValid(t *testing.T) {
	settings := models.DefaultQSScraperSettings()
	if err := ValidateSettings(&settings); err != nil {
		t.Fatalf("default settings should be valid: %v", err)
	}
}

func TestValidateSettingsRejectsInvalidPageRange(t *testing.T) {
	settings := models.DefaultQSScraperSettings()
	settings.EndPage = 0
	if err := ValidateSettings(&settings); err == nil {
		t.Fatal("expected invalid page range to be rejected")
	}
}
