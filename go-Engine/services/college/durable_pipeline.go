package collegesvc

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"gobackend/config"

	amqp "github.com/rabbitmq/amqp091-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const defaultPipelineVersion = "college-details-v1"

type PipelineRun struct {
	ID               string    `bson:"_id" json:"pipeline_id"`
	CollegeName      string    `bson:"college_name" json:"college_name"`
	CollegeSlug      string    `bson:"college_slug" json:"college_slug"`
	Country          string    `bson:"country" json:"country"`
	OriginalQuery    string    `bson:"original_query" json:"original_query"`
	Year             int       `bson:"year" json:"year"`
	PipelineVersion  string    `bson:"pipeline_version" json:"pipeline_version"`
	Generation       int       `bson:"generation" json:"generation"`
	Status           string    `bson:"status" json:"status"`
	TotalTasks       int       `bson:"total_tasks" json:"total_tasks"`
	CompletedTasks   int       `bson:"completed_tasks" json:"completed_tasks"`
	FailedTasks      int       `bson:"failed_tasks" json:"failed_tasks"`
	TasksInitialized bool      `bson:"tasks_initialized" json:"tasks_initialized"`
	CreatedAt        time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt        time.Time `bson:"updated_at" json:"updated_at"`
}

type pipelineTaskSpec struct {
	TaskType     string
	ModeOrPortal string
	RoutingKey   string
	Payload      bson.M
}

var durablePipelineOnce sync.Once

func pipelineVersion() string {
	if value := strings.TrimSpace(os.Getenv("COLLEGE_PIPELINE_VERSION")); value != "" {
		return value
	}
	return defaultPipelineVersion
}

func stableID(parts ...string) string {
	digest := sha256.Sum256([]byte(strings.Join(parts, "|")))
	return hex.EncodeToString(digest[:])
}

func rabbitQueue(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}

func pipelineTaskSpecs(collegeName, slug, country, pipelineID string, year, generation int) []pipelineTaskSpec {
	base := bson.M{
		"pipeline_id": pipelineID, "college_name": collegeName, "college_slug": slug,
		"country": country, "year": year, "generation": generation, "attempt": 0,
	}
	officialQueue := rabbitQueue("RABBITMQ_QUEUE_OFFICIAL", "academic_official_tasks")
	studyQueue := rabbitQueue("RABBITMQ_QUEUE_STUDYPORTALS", "academic_studyportals_tasks")
	generalQueue := rabbitQueue("RABBITMQ_QUEUE_GENERAL", "academic_general_tasks")

	copyPayload := func(extra bson.M) bson.M {
		result := bson.M{}
		for key, value := range base {
			result[key] = value
		}
		for key, value := range extra {
			result[key] = value
		}
		return result
	}
	var specs []pipelineTaskSpec
	for _, mode := range []string{"ug", "pg", "phd", "departments", "scholarships", "events", "facilities", "admissions", "alumni", "onlinecourses"} {
		specs = append(specs, pipelineTaskSpec{"official", mode, officialQueue, copyPayload(bson.M{"type": "official", "mode": mode, "mode_or_portal": mode})})
	}
	specs = append(specs, pipelineTaskSpec{"studyportals", "all", studyQueue, copyPayload(bson.M{
		"type": "studyportals", "mode_or_portal": "all",
		"levels": []string{"ug", "pg", "phd", "ug_scholarship", "pg_scholarship", "phd_scholarship"},
	})})
	for _, taskType := range []string{"placement", "student_stats", "about"} {
		specs = append(specs, pipelineTaskSpec{taskType, taskType, generalQueue, copyPayload(bson.M{"type": taskType, "mode_or_portal": taskType})})
	}
	for _, portal := range []string{"qs", "shiksha", "the", "collegedunia"} {
		specs = append(specs, pipelineTaskSpec{"portal", portal, generalQueue, copyPayload(bson.M{"type": "portal", "portal": portal, "mode_or_portal": portal})})
	}
	return specs
}

// InitDurableCollegePipeline resumes dispatch and monitoring after a Go restart.
func InitDurableCollegePipeline(ctx context.Context) error {
	if config.PipelineRunsCollection == nil || config.PipelineTasksCollection == nil {
		return fmt.Errorf("pipeline MongoDB collections are not initialized")
	}
	if err := reconcilePipelineTasks(ctx); err != nil {
		return fmt.Errorf("reconcile pipeline tasks: %w", err)
	}
	durablePipelineOnce.Do(func() {
		go pipelineDispatchLoop(ctx)
		go pipelineMonitorLoop(ctx)
	})
	return nil
}

func GetLatestCollegePipeline(collegeName string) (*PipelineRun, error) {
	var run PipelineRun
	err := config.PipelineRunsCollection.FindOne(context.Background(), bson.M{
		"college_slug": detailPipelineKey(collegeName), "year": detailPipelineYear(), "pipeline_version": pipelineVersion(),
	}, options.FindOne().SetSort(bson.D{{Key: "generation", Value: -1}})).Decode(&run)
	if err != nil {
		return nil, err
	}
	return &run, nil
}

func ensureDurablePipeline(collegeName, country, originalQuery string, force bool) (PipelineRun, bool, error) {
	year := detailPipelineYear()
	version := pipelineVersion()
	slug := detailPipelineKey(collegeName)
	generation := 1
	var latest PipelineRun
	latestErr := config.PipelineRunsCollection.FindOne(context.Background(), bson.M{
		"college_slug": slug, "year": year, "pipeline_version": version,
	}, options.FindOne().SetSort(bson.D{{Key: "generation", Value: -1}})).Decode(&latest)
	if latestErr != nil && latestErr != mongo.ErrNoDocuments {
		return PipelineRun{}, false, latestErr
	}
	if latestErr == nil {
		if !force {
			return latest, false, nil
		}
		generation = latest.Generation + 1
	}
	pipelineID := stableID(slug, strconv.Itoa(year), version, strconv.Itoa(generation))
	now := time.Now().UTC()
	complete := false
	if dir, _ := findFullCollegeBundle(collegeName, year); dir != "" {
		complete = fullCollegeBundleComplete(dir) && !force
	}
	status := "queued"
	if complete {
		status = "completed"
	}
	specs := pipelineTaskSpecs(collegeName, slug, country, pipelineID, year, generation)
	result, err := config.PipelineRunsCollection.UpdateOne(context.Background(), bson.M{"_id": pipelineID}, bson.M{
		"$setOnInsert": bson.M{
			"_id": pipelineID, "college_name": collegeName, "college_slug": slug, "country": country,
			"original_query": originalQuery, "year": year, "pipeline_version": version,
			"generation": generation, "status": status, "total_tasks": len(specs),
			"completed_tasks": 0, "failed_tasks": 0, "tasks_initialized": complete, "created_at": now, "updated_at": now,
		},
	}, options.Update().SetUpsert(true))
	if err != nil {
		return PipelineRun{}, false, err
	}
	created := result.UpsertedCount == 1
	var run PipelineRun
	if err := config.PipelineRunsCollection.FindOne(context.Background(), bson.M{"_id": pipelineID}).Decode(&run); err != nil {
		return PipelineRun{}, false, err
	}
	if !complete && (created || !run.TasksInitialized) {
		if err := createPipelineTasks(run, specs); err != nil {
			return PipelineRun{}, false, err
		}
	}
	return run, created, nil
}

// Recreate deterministic initial task records for active runs on startup. This
// repairs a crash between inserting pipeline_runs and inserting pipeline_tasks.
func reconcilePipelineTasks(ctx context.Context) error {
	cursor, err := config.PipelineRunsCollection.Find(ctx, bson.M{
		"pipeline_version":  pipelineVersion(),
		"status":            bson.M{"$in": []string{"queued", "running", "tasks_complete"}},
		"tasks_initialized": bson.M{"$ne": true},
	}, options.Find().SetBatchSize(500))
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)
	for cursor.Next(ctx) {
		var run PipelineRun
		if err := cursor.Decode(&run); err != nil {
			return err
		}
		specs := pipelineTaskSpecs(run.CollegeName, run.CollegeSlug, run.Country, run.ID, run.Year, run.Generation)
		if err := createPipelineTasks(run, specs); err != nil {
			return err
		}
	}
	return cursor.Err()
}

func createPipelineTasks(run PipelineRun, specs []pipelineTaskSpec) error {
	now := time.Now().UTC()
	models := make([]mongo.WriteModel, 0, len(specs))
	for _, spec := range specs {
		taskID := stableID(run.ID, spec.TaskType, spec.ModeOrPortal)
		payload := spec.Payload
		payload["task_id"] = taskID
		models = append(models, mongo.NewUpdateOneModel().SetFilter(bson.M{"_id": taskID}).SetUpdate(bson.M{"$setOnInsert": bson.M{
			"_id": taskID, "pipeline_id": run.ID, "college_slug": run.CollegeSlug,
			"task_type": spec.TaskType, "mode_or_portal": spec.ModeOrPortal,
			"routing_key": spec.RoutingKey, "payload": payload, "status": "queued",
			"publish_status": "pending", "attempt": 0, "next_attempt_at": now,
			"created_at": now, "updated_at": now,
		}}).SetUpsert(true))
	}
	if len(models) == 0 {
		return nil
	}
	if _, err := config.PipelineTasksCollection.BulkWrite(context.Background(), models, options.BulkWrite().SetOrdered(false)); err != nil {
		return err
	}
	_, err := config.PipelineRunsCollection.UpdateOne(context.Background(), bson.M{"_id": run.ID}, bson.M{"$set": bson.M{"tasks_initialized": true, "updated_at": time.Now().UTC()}})
	return err
}

type dispatchTask struct {
	ID            string    `bson:"_id"`
	RoutingKey    string    `bson:"routing_key"`
	Payload       bson.M    `bson:"payload"`
	Attempt       int       `bson:"attempt"`
	PublishStatus string    `bson:"publish_status"`
	NextAttemptAt time.Time `bson:"next_attempt_at"`
	Status        string    `bson:"status"`
	DLQStatus     string    `bson:"dlq_status"`
	LastError     string    `bson:"last_error"`
}

func pipelineDispatchLoop(ctx context.Context) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			recoverExpiredWorkerLeases(ctx)
			if err := dispatchPendingPipelineTasks(ctx, 100); err != nil {
				log.Printf("[Pipeline dispatcher] %v", err)
			}
			if err := dispatchPendingDeadLetters(ctx, 25); err != nil {
				log.Printf("[Pipeline DLQ dispatcher] %v", err)
			}
		}
	}
}

func recoverExpiredWorkerLeases(ctx context.Context) {
	now := time.Now().UTC()
	maxRetries := 3
	if raw := strings.TrimSpace(os.Getenv("PIPELINE_MAX_RETRIES")); raw != "" {
		if parsed, parseErr := strconv.Atoi(raw); parseErr == nil && parsed >= 0 {
			maxRetries = parsed
		}
	}
	exhaustedFilter := bson.M{"status": "running", "lease_expires_at": bson.M{"$lte": now}, "attempt": bson.M{"$gt": maxRetries}}
	pipelineIDs, _ := config.PipelineTasksCollection.Distinct(ctx, "pipeline_id", exhaustedFilter)
	_, err := config.PipelineTasksCollection.UpdateMany(ctx, exhaustedFilter, bson.M{
		"$set":   bson.M{"status": "failed", "publish_status": "failed", "dlq_status": "pending", "last_error": "worker lease expired after retry exhaustion", "updated_at": now},
		"$unset": bson.M{"lease_token": "", "lease_expires_at": "", "worker_id": ""},
	})
	if err != nil {
		log.Printf("[Pipeline dispatcher] expired exhausted lease recovery failed: %v", err)
	}
	_, err = config.PipelineTasksCollection.UpdateMany(ctx, bson.M{
		"status": "running", "lease_expires_at": bson.M{"$lte": now}, "attempt": bson.M{"$lte": maxRetries},
	}, bson.M{
		"$set":   bson.M{"status": "retry_wait", "publish_status": "retry_wait", "next_attempt_at": now, "last_error": "worker lease expired", "updated_at": now},
		"$unset": bson.M{"lease_token": "", "lease_expires_at": "", "worker_id": ""},
	})
	if err != nil {
		log.Printf("[Pipeline dispatcher] expired lease recovery failed: %v", err)
	}
	for _, rawID := range pipelineIDs {
		if pipelineID, ok := rawID.(string); ok {
			refreshPipelineRunCounters(ctx, pipelineID)
		}
	}
}

func refreshPipelineRunCounters(ctx context.Context, pipelineID string) {
	total, err := config.PipelineTasksCollection.CountDocuments(ctx, bson.M{"pipeline_id": pipelineID})
	if err != nil || total == 0 {
		return
	}
	completed, _ := config.PipelineTasksCollection.CountDocuments(ctx, bson.M{"pipeline_id": pipelineID, "status": "succeeded"})
	failed, _ := config.PipelineTasksCollection.CountDocuments(ctx, bson.M{"pipeline_id": pipelineID, "status": bson.M{"$in": []string{"failed", "cancelled"}}})
	status := "running"
	if completed == total {
		status = "tasks_complete"
	} else if completed+failed == total && failed > 0 {
		status = "failed"
	}
	_, _ = config.PipelineRunsCollection.UpdateOne(ctx, bson.M{"_id": pipelineID}, bson.M{"$set": bson.M{"status": status, "total_tasks": total, "completed_tasks": completed, "failed_tasks": failed, "updated_at": time.Now().UTC()}})
}

func rabbitConnectionURL() string {
	if rabbitURL := strings.TrimSpace(os.Getenv("RABBITMQ_URL")); rabbitURL != "" {
		return rabbitURL
	}
	host := strings.TrimSpace(os.Getenv("RABBITMQ_HOST"))
	if host == "" {
		host = "localhost"
	}
	port := strings.TrimSpace(os.Getenv("RABBITMQ_PORT"))
	if port == "" {
		port = "5672"
	}
	user := strings.TrimSpace(os.Getenv("RABBITMQ_USER"))
	if user == "" {
		user = "guest"
	}
	password := os.Getenv("RABBITMQ_PASSWORD")
	if password == "" {
		password = "guest"
	}
	vhost := strings.TrimSpace(os.Getenv("RABBITMQ_VHOST"))
	if vhost == "" || vhost == "/" {
		vhost = "/"
	} else {
		vhost = "/" + strings.TrimPrefix(vhost, "/")
	}
	return (&url.URL{Scheme: "amqp", User: url.UserPassword(user, password), Host: net.JoinHostPort(host, port), Path: vhost}).String()
}

func dispatchPendingPipelineTasks(ctx context.Context, limit int64) error {
	now := time.Now().UTC()
	cursor, err := config.PipelineTasksCollection.Find(ctx, bson.M{
		"$or": []bson.M{
			{"publish_status": "pending", "next_attempt_at": bson.M{"$lte": now}},
			{"publish_status": "retry_wait", "next_attempt_at": bson.M{"$lte": now}},
			{"publish_status": "publishing", "publish_lease_expires_at": bson.M{"$lte": now}},
		},
	}, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "next_attempt_at", Value: 1}}))
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)
	var candidates []dispatchTask
	if err := cursor.All(ctx, &candidates); err != nil || len(candidates) == 0 {
		return err
	}

	conn, err := amqp.Dial(rabbitConnectionURL())
	if err != nil {
		return err
	}
	defer conn.Close()
	channel, err := conn.Channel()
	if err != nil {
		return err
	}
	defer channel.Close()
	if err := channel.Confirm(false); err != nil {
		return err
	}
	confirmations := channel.NotifyPublish(make(chan amqp.Confirmation, 1))
	dispatcherID := stableID(strconv.FormatInt(time.Now().UnixNano(), 10))[:16]

	for _, candidate := range candidates {
		claimFilter := bson.M{"_id": candidate.ID, "$or": []bson.M{
			{"publish_status": "pending", "next_attempt_at": bson.M{"$lte": now}},
			{"publish_status": "retry_wait", "next_attempt_at": bson.M{"$lte": now}},
			{"publish_status": "publishing", "publish_lease_expires_at": bson.M{"$lte": now}},
		}}
		claim := bson.M{"$set": bson.M{"publish_status": "publishing", "publisher_id": dispatcherID, "publish_lease_expires_at": now.Add(30 * time.Second), "updated_at": now}}
		result := config.PipelineTasksCollection.FindOneAndUpdate(ctx, claimFilter, claim, options.FindOneAndUpdate().SetReturnDocument(options.After))
		var task dispatchTask
		if result.Decode(&task) != nil {
			continue
		}
		task.Payload["attempt"] = task.Attempt
		body, _ := json.Marshal(task.Payload)
		if _, err := channel.QueueDeclare(task.RoutingKey, true, false, false, false, nil); err != nil {
			return err
		}
		err = channel.PublishWithContext(ctx, "", task.RoutingKey, false, false, amqp.Publishing{
			ContentType: "application/json", DeliveryMode: amqp.Persistent, MessageId: task.ID,
			Timestamp: now, Body: body,
		})
		confirmed := false
		if err == nil {
			select {
			case confirmation := <-confirmations:
				confirmed = confirmation.Ack
			case <-time.After(10 * time.Second):
				err = fmt.Errorf("publisher confirmation timeout")
			}
		}
		if err != nil || !confirmed {
			_, _ = config.PipelineTasksCollection.UpdateOne(ctx, bson.M{"_id": task.ID, "publisher_id": dispatcherID}, bson.M{"$set": bson.M{"publish_status": "pending", "last_publish_error": fmt.Sprint(err), "updated_at": time.Now().UTC()}})
			continue
		}
		_, _ = config.PipelineTasksCollection.UpdateOne(ctx, bson.M{"_id": task.ID, "publisher_id": dispatcherID}, bson.M{"$set": bson.M{"publish_status": "published", "status": "queued", "published_at": time.Now().UTC(), "updated_at": time.Now().UTC()}, "$unset": bson.M{"publish_lease_expires_at": "", "publisher_id": ""}})
	}
	return nil
}

// Failed tasks use a second Mongo-backed outbox so a worker crash cannot lose
// the DLQ notification after its durable failure state has been committed.
func dispatchPendingDeadLetters(ctx context.Context, limit int64) error {
	now := time.Now().UTC()
	cursor, err := config.PipelineTasksCollection.Find(ctx, bson.M{
		"status": "failed",
		"$or": []bson.M{
			{"dlq_status": "pending"},
			{"dlq_status": "publishing", "dlq_lease_expires_at": bson.M{"$lte": now}},
		},
	}, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "updated_at", Value: 1}}))
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)
	var candidates []dispatchTask
	if err := cursor.All(ctx, &candidates); err != nil || len(candidates) == 0 {
		return err
	}

	conn, err := amqp.Dial(rabbitConnectionURL())
	if err != nil {
		return err
	}
	defer conn.Close()
	channel, err := conn.Channel()
	if err != nil {
		return err
	}
	defer channel.Close()
	if err := channel.Confirm(false); err != nil {
		return err
	}
	dlq := rabbitQueue("RABBITMQ_DLQ", "academic_dead_letter")
	if _, err := channel.QueueDeclare(dlq, true, false, false, false, nil); err != nil {
		return err
	}
	confirmations := channel.NotifyPublish(make(chan amqp.Confirmation, 1))
	dispatcherID := stableID("dlq", strconv.FormatInt(time.Now().UnixNano(), 10))[:16]

	for _, candidate := range candidates {
		claimFilter := bson.M{"_id": candidate.ID, "status": "failed", "$or": []bson.M{
			{"dlq_status": "pending"},
			{"dlq_status": "publishing", "dlq_lease_expires_at": bson.M{"$lte": now}},
		}}
		claim := bson.M{"$set": bson.M{"dlq_status": "publishing", "dlq_publisher_id": dispatcherID, "dlq_lease_expires_at": now.Add(30 * time.Second), "updated_at": now}}
		result := config.PipelineTasksCollection.FindOneAndUpdate(ctx, claimFilter, claim, options.FindOneAndUpdate().SetReturnDocument(options.After))
		var task dispatchTask
		if result.Decode(&task) != nil {
			continue
		}
		payload := task.Payload
		payload["attempt"] = task.Attempt
		payload["_dlq_reason"] = task.LastError
		payload["_dlq_task_id"] = task.ID
		body, _ := json.Marshal(payload)
		err = channel.PublishWithContext(ctx, "", dlq, false, false, amqp.Publishing{
			ContentType: "application/json", DeliveryMode: amqp.Persistent,
			MessageId: task.ID + ":dlq", Timestamp: now, Body: body,
		})
		confirmed := false
		if err == nil {
			select {
			case confirmation := <-confirmations:
				confirmed = confirmation.Ack
			case <-time.After(10 * time.Second):
				err = fmt.Errorf("DLQ publisher confirmation timeout")
			}
		}
		if err != nil || !confirmed {
			_, _ = config.PipelineTasksCollection.UpdateOne(ctx, bson.M{"_id": task.ID, "dlq_publisher_id": dispatcherID}, bson.M{"$set": bson.M{"dlq_status": "pending", "last_dlq_error": fmt.Sprint(err), "updated_at": time.Now().UTC()}})
			continue
		}
		_, _ = config.PipelineTasksCollection.UpdateOne(ctx, bson.M{"_id": task.ID, "dlq_publisher_id": dispatcherID}, bson.M{"$set": bson.M{"dlq_status": "published", "dlq_published_at": time.Now().UTC(), "updated_at": time.Now().UTC()}, "$unset": bson.M{"dlq_lease_expires_at": "", "dlq_publisher_id": ""}})
	}
	return nil
}
