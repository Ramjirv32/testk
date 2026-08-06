package qsranking

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"gobackend/config"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type ScheduleStatus struct {
	Enabled          bool       `json:"enabled"`
	CheckInterval    string     `json:"check_interval"`
	LastSuccessfulAt *time.Time `json:"last_successful_at,omitempty"`
	NextRunAt        *time.Time `json:"next_run_at,omitempty"`
	Due              bool       `json:"due"`
}

func AnnualRefreshEnabled() bool {
	value := strings.ToLower(strings.TrimSpace(os.Getenv("QS_ANNUAL_REFRESH_ENABLED")))
	return value != "0" && value != "false" && value != "no"
}

func GetScheduleStatus(ctx context.Context, now time.Time) (ScheduleStatus, error) {
	status := ScheduleStatus{Enabled: AnnualRefreshEnabled(), CheckInterval: "24h"}
	var meta struct {
		UpdatedAt time.Time `bson:"updated_at"`
	}
	err := config.TruDB.Collection("qs_rankings_meta").FindOne(ctx, bson.M{"_id": "latest"}).Decode(&meta)
	if err == nil && !meta.UpdatedAt.IsZero() {
		last := meta.UpdatedAt.UTC()
		next := last.AddDate(1, 0, 0)
		status.LastSuccessfulAt = &last
		status.NextRunAt = &next
		status.Due = !now.UTC().Before(next)
		return status, nil
	}
	if err != nil && err != mongo.ErrNoDocuments {
		return status, err
	}
	status.Due = true
	return status, nil
}

func CheckAnnualRefresh(ctx context.Context) {
	if !AnnualRefreshEnabled() || GetRunStatus().Running {
		return
	}
	status, err := GetScheduleStatus(ctx, time.Now().UTC())
	if err != nil || !status.Due {
		if err != nil {
			log.Printf(" QS annual refresh check failed: %v", err)
		}
		return
	}
	settings, err := EnsureSettings(ctx)
	if err != nil {
		log.Printf(" QS annual refresh settings failed: %v", err)
		return
	}
	if _, err := StartOrchestrator(settings); err != nil && err != ErrAlreadyRunning {
		log.Printf(" QS annual refresh start failed: %v", err)
		return
	}
	log.Println(" QS annual rankings refresh started")
}

func GetDirectoryScheduleStatus(ctx context.Context, now time.Time) (ScheduleStatus, error) {
	status := ScheduleStatus{Enabled: AnnualRefreshEnabled(), CheckInterval: "24h"}
	var meta struct {
		UpdatedAt time.Time `bson:"updated_at"`
	}
	err := config.TruDB.Collection("qs_university_directory_meta").FindOne(ctx, bson.M{"_id": "latest"}).Decode(&meta)
	if err == nil && !meta.UpdatedAt.IsZero() {
		last := meta.UpdatedAt.UTC()
		next := last.AddDate(1, 0, 0)
		status.LastSuccessfulAt = &last
		status.NextRunAt = &next
		status.Due = !now.UTC().Before(next)
		return status, nil
	}
	if err != nil && err != mongo.ErrNoDocuments {
		return status, err
	}
	status.Due = true
	return status, nil
}

func CheckAnnualDirectoryRefresh(ctx context.Context) {
	if !AnnualRefreshEnabled() || GetDirectoryRunStatus().Running {
		return
	}
	status, err := GetDirectoryScheduleStatus(ctx, time.Now().UTC())
	if err != nil || !status.Due {
		if err != nil {
			log.Printf(" QS directory annual refresh check failed: %v", err)
		}
		return
	}
	settings, err := EnsureDirectorySettings(ctx)
	if err != nil {
		log.Printf(" QS directory annual refresh settings failed: %v", err)
		return
	}
	if _, err := StartDirectoryOrchestrator(settings); err != nil && err != ErrDirectoryAlreadyRunning {
		log.Printf(" QS directory annual refresh start failed: %v", err)
		return
	}
	log.Println(" QS university directory annual refresh started")
}

func StartAnnualScheduler(ctx context.Context) {
	if !AnnualRefreshEnabled() {
		log.Println(" QS annual rankings refresh is disabled")
		return
	}
	log.Println(" QS annual rankings scheduler enabled (checks daily; runs one year after last successful import)")
	go func() {
		CheckAnnualRefresh(ctx)
		CheckAnnualDirectoryRefresh(ctx)
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				checkCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
				CheckAnnualRefresh(checkCtx)
				CheckAnnualDirectoryRefresh(checkCtx)
				cancel()
			}
		}
	}()
}
