package messaging

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"gobackend/services/cache"
	collegesvc "gobackend/services/college"
)

type CollegeEvent struct {
	Type      string    `json:"type"`
	CollegeID string    `json:"college_id"`
	Timestamp time.Time `json:"timestamp"`
}

type RabbitMQService struct {
	conn         *amqp.Connection
	channel      *amqp.Channel
	exchangeName string
	queueName    string
}

var rabbitMQService *RabbitMQService

func InitRabbitMQ() error {
	url := os.Getenv("RABBITMQ_URL")
	if url == "" {
		url = "amqp://guest:guest@localhost:5672/"
	}

	exchangeName := os.Getenv("RABBITMQ_EXCHANGE")
	if exchangeName == "" {
		exchangeName = "college_events"
	}

	queueName := os.Getenv("RABBITMQ_QUEUE")
	if queueName == "" {
		queueName = "cache_invalidation"
	}

	conn, err := amqp.Dial(url)
	if err != nil {
		return fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return fmt.Errorf("failed to open channel: %w", err)
	}

	err = ch.ExchangeDeclare(
		exchangeName,
		"fanout",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return fmt.Errorf("failed to declare exchange: %w", err)
	}

	_, err = ch.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return fmt.Errorf("failed to declare queue: %w", err)
	}

	err = ch.QueueBind(
		queueName,
		"",
		exchangeName,
		false,
		nil,
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return fmt.Errorf("failed to bind queue: %w", err)
	}

	rabbitMQService = &RabbitMQService{
		conn:         conn,
		channel:      ch,
		exchangeName: exchangeName,
		queueName:    queueName,
	}

	log.Printf(" RabbitMQ connected: %s", url)
	return nil
}

func PublishCollegeUpdated(collegeID string) error {
	if rabbitMQService == nil {
		return fmt.Errorf("RabbitMQ not initialized")
	}

	event := CollegeEvent{
		Type:      "COLLEGE_UPDATED",
		CollegeID: collegeID,
		Timestamp: time.Now(),
	}

	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = rabbitMQService.channel.PublishWithContext(
		ctx,
		rabbitMQService.exchangeName,
		"",
		false,
		false,
		amqp.Publishing{
			ContentType:  "application/json",
			Body:         body,
			DeliveryMode: amqp.Persistent,
		},
	)

	if err != nil {
		return fmt.Errorf("failed to publish event: %w", err)
	}

	log.Printf(" Published COLLEGE_UPDATED event: %s", collegeID)
	return nil
}

func StartCacheConsumer() error {
	if rabbitMQService == nil {
		return fmt.Errorf("RabbitMQ not initialized")
	}

	msgs, err := rabbitMQService.channel.Consume(
		rabbitMQService.queueName,
		"",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %w", err)
	}

	go func() {
		log.Println(" Cache consumer started, listening for events...")
		for msg := range msgs {
			var event CollegeEvent
			if err := json.Unmarshal(msg.Body, &event); err != nil {
				log.Printf(" Failed to unmarshal event: %v", err)
				msg.Nack(false, false)
				continue
			}

			if event.Type == "COLLEGE_UPDATED" {
				handleCacheInvalidation(event.CollegeID)
			}

			msg.Ack(false)
		}
	}()

	return nil
}

func handleCacheInvalidation(collegeID string) {
	log.Printf(" Processing cache invalidation for: %s", collegeID)

	redisService := cache.NewRedisService()

	cachedCollege, cacheErr := redisService.GetCollegeFromRedis(collegeID)
	cacheExists := cacheErr == nil && cachedCollege != nil

	if cacheExists {
		log.Printf(" Found existing cache for: %s", collegeID)
	} else {
		log.Printf("ℹ️ No existing cache for: %s", collegeID)
	}

	dbCollege, dbErr := collegesvc.GetApprovedCollegeByName(collegeID)

	if dbErr != nil || dbCollege == nil {
		if cacheExists {
			log.Printf(" College %s not approved in DB, deleting from cache", collegeID)
			if err := redisService.DeleteCollegeFromRedis(collegeID); err != nil {
				log.Printf(" Failed to delete cache for %s: %v", collegeID, err)
			} else {
				log.Printf(" Deleted cache key: college:%s", collegeID)
			}
		} else {
			log.Printf("ℹ️ College %s not in DB and not in cache, no action needed", collegeID)
		}
		return
	}

	if cacheExists {
		if cachedCollege.UpdatedAt.Equal(dbCollege.UpdatedAt) {
			log.Printf(" Cache for %s is up-to-date, no action needed", collegeID)
			return
		}

		log.Printf(" Cache for %s is outdated, updating with fresh data from DB", collegeID)
		if err := redisService.UpdateCollegeInRedis(dbCollege); err != nil {
			log.Printf(" Failed to update cache for %s: %v", collegeID, err)
			log.Printf(" Deleting stale cache for %s", collegeID)
			redisService.DeleteCollegeFromRedis(collegeID)
		} else {
			log.Printf(" Updated cache with fresh data for: %s", collegeID)
		}
	} else {
		log.Printf(" Creating new cache entry for: %s", collegeID)
		if err := redisService.SaveCollegeToRedis(dbCollege); err != nil {
			log.Printf(" Failed to create cache for %s: %v", collegeID, err)
		} else {
			log.Printf(" Created new cache entry for: %s", collegeID)
		}
	}

	log.Printf(" Cache management completed for: %s", collegeID)
}

func CloseRabbitMQ() {
	if rabbitMQService != nil {
		if rabbitMQService.channel != nil {
			rabbitMQService.channel.Close()
		}
		if rabbitMQService.conn != nil {
			rabbitMQService.conn.Close()
		}
		log.Println(" RabbitMQ connection closed")
	}
}
