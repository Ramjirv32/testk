package qsranking

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"gobackend/config"
	"gobackend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func EnsureSettings(ctx context.Context) (*models.QSScraperSettings, error) {
	defaults := models.DefaultQSScraperSettings()
	_, err := config.QSScraperSettingsCollection.UpdateOne(
		ctx,
		bson.M{"_id": models.DefaultQSScraperSettingsID},
		bson.M{"$setOnInsert": defaults},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return nil, fmt.Errorf("store default QS scraper settings: %w", err)
	}
	return GetSettings(ctx)
}

func EnsureDirectorySettings(ctx context.Context) (*models.QSScraperSettings, error) {
	defaults := models.DefaultQSDirectorySettings()
	_, err := config.QSScraperSettingsCollection.UpdateOne(ctx,
		bson.M{"_id": models.DefaultQSDirectorySettingsID},
		bson.M{"$setOnInsert": defaults}, options.Update().SetUpsert(true))
	if err != nil {
		return nil, fmt.Errorf("store QS directory settings: %w", err)
	}
	return GetDirectorySettings(ctx)
}

func GetDirectorySettings(ctx context.Context) (*models.QSScraperSettings, error) {
	var settings models.QSScraperSettings
	err := config.QSScraperSettingsCollection.FindOne(ctx,
		bson.M{"_id": models.DefaultQSDirectorySettingsID}).Decode(&settings)
	if err == mongo.ErrNoDocuments {
		return EnsureDirectorySettings(ctx)
	}
	if err != nil {
		return nil, fmt.Errorf("load QS directory settings: %w", err)
	}
	return &settings, nil
}

func SaveDirectorySettings(ctx context.Context, incoming models.QSScraperSettings) (*models.QSScraperSettings, error) {
	if err := ValidateSettings(&incoming); err != nil {
		return nil, err
	}
	existing, err := GetDirectorySettings(ctx)
	if err != nil {
		return nil, err
	}
	incoming.ID = models.DefaultQSDirectorySettingsID
	incoming.CreatedAt = existing.CreatedAt
	incoming.UpdatedAt = time.Now().UTC()
	_, err = config.QSScraperSettingsCollection.ReplaceOne(ctx,
		bson.M{"_id": models.DefaultQSDirectorySettingsID}, incoming,
		options.Replace().SetUpsert(true))
	if err != nil {
		return nil, fmt.Errorf("save QS directory settings: %w", err)
	}
	return &incoming, nil
}

func GetSettings(ctx context.Context) (*models.QSScraperSettings, error) {
	var settings models.QSScraperSettings
	err := config.QSScraperSettingsCollection.FindOne(
		ctx,
		bson.M{"_id": models.DefaultQSScraperSettingsID},
	).Decode(&settings)
	if err == mongo.ErrNoDocuments {
		return EnsureSettings(ctx)
	}
	if err != nil {
		return nil, fmt.Errorf("load QS scraper settings: %w", err)
	}
	return &settings, nil
}

func SaveSettings(ctx context.Context, incoming models.QSScraperSettings) (*models.QSScraperSettings, error) {
	if err := ValidateSettings(&incoming); err != nil {
		return nil, err
	}

	existing, err := GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	incoming.ID = models.DefaultQSScraperSettingsID
	incoming.CreatedAt = existing.CreatedAt
	incoming.UpdatedAt = time.Now().UTC()

	_, err = config.QSScraperSettingsCollection.ReplaceOne(
		ctx,
		bson.M{"_id": models.DefaultQSScraperSettingsID},
		incoming,
		options.Replace().SetUpsert(true),
	)
	if err != nil {
		return nil, fmt.Errorf("save QS scraper settings: %w", err)
	}
	return &incoming, nil
}

func ValidateSettings(settings *models.QSScraperSettings) error {
	parsedURL, err := url.ParseRequestURI(strings.TrimSpace(settings.BaseURL))
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") || parsedURL.Host == "" {
		return fmt.Errorf("base_url must be a valid HTTP or HTTPS URL")
	}
	if settings.StartPage < 1 {
		return fmt.Errorf("start_page must be at least 1")
	}
	if settings.EndPage < settings.StartPage || settings.EndPage > 10000 {
		return fmt.Errorf("end_page must be between start_page and 10000")
	}
	if settings.PagerLimit < 1 || settings.PagerLimit > 500 {
		return fmt.Errorf("pager_limit must be between 1 and 500")
	}
	if settings.WaitMS < 0 || settings.WaitMS > 300000 {
		return fmt.Errorf("wait_ms must be between 0 and 300000")
	}
	if settings.PageTimeoutMS < 1000 || settings.PageTimeoutMS > 900000 {
		return fmt.Errorf("page_timeout_ms must be between 1000 and 900000")
	}
	return nil
}
