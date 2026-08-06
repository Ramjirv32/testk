package qsranking

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const profileQueueName = "qs_profile_scrape_requests"

type profileQueueMessage struct {
	Name string `json:"name"`
}

var profileJobs = struct {
	sync.Mutex
	state map[string]string
}{state: make(map[string]string)}

var profileQueue = struct {
	sync.Mutex
	conn      *amqp.Connection
	publisher *amqp.Channel
}{}

func profileJobKey(name string) string {
	return strings.ToLower(strings.Join(strings.Fields(name), " "))
}

func IsProfileRunning(name string) bool {
	profileJobs.Lock()
	defer profileJobs.Unlock()
	_, exists := profileJobs.state[profileJobKey(name)]
	return exists
}

func profileCDPPool() []string {
	defaults := []string{
		"https://cr19501.cloudlab.works", "https://cr19502.cloudlab.works",
		"https://cr19503.cloudlab.works", "https://cr19504.cloudlab.works",
		"https://cr19505.cloudlab.works", "https://cr19506.cloudlab.works",
		"https://cr19508.cloudlab.works", "https://cr19509.cloudlab.works",
		"https://cr19510.cloudlab.works", "https://cr19511.cloudlab.works",
	}
	names := []string{
		"OFFICIAL_CDP_URL_UG", "OFFICIAL_CDP_URL_PG", "OFFICIAL_CDP_URL_PHD",
		"OFFICIAL_CDP_URL_ADMISSIONS", "OFFICIAL_CDP_URL_SCHOLARSHIPS",
		"OFFICIAL_CDP_URL_FACILITIES", "OFFICIAL_CDP_URL_EVENTS",
		"OFFICIAL_CDP_URL_DEPARTMENTS", "OFFICIAL_CDP_URL_ONLINECOURSES",
		"OFFICIAL_CDP_URL_ALUMNI",
	}
	pool := make([]string, 0, len(names))
	seen := make(map[string]bool)
	for index, name := range names {
		value := strings.TrimSpace(os.Getenv(name))
		if value == "" {
			value = defaults[index]
		}
		if value != "" && !seen[value] {
			seen[value] = true
			pool = append(pool, value)
		}
	}
	return pool
}

// StartProfileQueue starts a durable RabbitMQ queue with a bounded consumer
// pool. Twenty concurrent jobs are distributed evenly across the ten CDP
// endpoints (two browser jobs per endpoint by default); excess requests wait
// safely in RabbitMQ instead of spawning unbounded processes.
func StartProfileQueue() error {
	profileQueue.Lock()
	defer profileQueue.Unlock()
	if profileQueue.conn != nil && !profileQueue.conn.IsClosed() {
		return nil
	}
	rabbitURL := strings.TrimSpace(os.Getenv("RABBITMQ_URL"))
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}
	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		return fmt.Errorf("connect QS profile RabbitMQ: %w", err)
	}
	publisher, err := conn.Channel()
	if err != nil {
		conn.Close()
		return err
	}
	if _, err = publisher.QueueDeclare(profileQueueName, true, false, false, false, nil); err != nil {
		publisher.Close()
		conn.Close()
		return err
	}
	consumer, err := conn.Channel()
	if err != nil {
		publisher.Close()
		conn.Close()
		return err
	}
	workerCount := 20
	if value, parseErr := strconv.Atoi(os.Getenv("QS_PROFILE_CONCURRENCY")); parseErr == nil && value > 0 && value <= 200 {
		workerCount = value
	}
	if err = consumer.Qos(workerCount, 0, false); err != nil {
		consumer.Close()
		publisher.Close()
		conn.Close()
		return err
	}
	deliveries, err := consumer.Consume(profileQueueName, "", false, false, false, false, nil)
	if err != nil {
		consumer.Close()
		publisher.Close()
		conn.Close()
		return err
	}
	profileQueue.conn = conn
	profileQueue.publisher = publisher
	pool := profileCDPPool()
	if len(pool) == 0 {
		pool = []string{strings.TrimSpace(os.Getenv("BROWSEROS_CDP"))}
	}
	for worker := 0; worker < workerCount; worker++ {
		cdpURL := pool[worker%len(pool)]
		go profileQueueWorker(deliveries, cdpURL)
	}
	return nil
}

func profileQueueWorker(deliveries <-chan amqp.Delivery, cdpURL string) {
	for delivery := range deliveries {
		var message profileQueueMessage
		if json.Unmarshal(delivery.Body, &message) != nil || strings.TrimSpace(message.Name) == "" {
			_ = delivery.Nack(false, false)
			continue
		}
		key := profileJobKey(message.Name)
		profileJobs.Lock()
		state := profileJobs.state[key]
		if state == "running" {
			profileJobs.Unlock()
			_ = delivery.Ack(false)
			continue
		}
		profileJobs.state[key] = "running"
		profileJobs.Unlock()
		err := runProfileScrape(message.Name, cdpURL)
		finishProfileJob(key)
		if err != nil {
			_ = delivery.Nack(false, false)
		} else {
			_ = delivery.Ack(false)
		}
	}
}

func StartProfileScrape(name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return fmt.Errorf("college name is required")
	}
	key := profileJobKey(name)
	profileJobs.Lock()
	if _, exists := profileJobs.state[key]; exists {
		profileJobs.Unlock()
		return ErrAlreadyRunning
	}
	profileJobs.state[key] = "queued"
	profileJobs.Unlock()
	body, _ := json.Marshal(profileQueueMessage{Name: name})
	profileQueue.Lock()
	defer profileQueue.Unlock()
	if profileQueue.publisher == nil {
		finishProfileJob(key)
		return fmt.Errorf("QS profile RabbitMQ queue is not initialized")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := profileQueue.publisher.PublishWithContext(ctx, "", profileQueueName, false, false, amqp.Publishing{
		ContentType: "application/json", DeliveryMode: amqp.Persistent, Body: body,
	}); err != nil {
		finishProfileJob(key)
		return fmt.Errorf("queue QS profile scrape: %w", err)
	}
	return nil
}

func runProfileScrape(name, cdpURL string) error {
	root, err := findProjectRoot()
	if err != nil {
		return err
	}
	script := filepath.Join(root, "scrapers", "portals", "qs", "download_profiles.py")
	logDir := filepath.Join(root, "logs", "qs_profiles")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return err
	}
	safeName := regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(strings.ToLower(name), "_")
	logFile, err := os.OpenFile(filepath.Join(logDir, strings.Trim(safeName, "_")+".log"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}
	defer logFile.Close()
	cmd := exec.Command("python3", "-u", script, "--college", name, "--force", "--workers", "1")
	cmd.Dir = root
	cmd.Stdout = logFile
	cmd.Stderr = logFile
	cmd.Env = append(os.Environ(), "BROWSEROS_CDP="+cdpURL)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("QS profile scraper failed: %w", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	_, _ = ImportDefaultProfiles(ctx)
	return nil
}

func finishProfileJob(key string) {
	profileJobs.Lock()
	delete(profileJobs.state, key)
	profileJobs.Unlock()
}
