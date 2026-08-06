package realtime

import (
	"context"
	"log"
	"regexp"
	"sync"
	"time"

	"gobackend/config"
	"gobackend/models"
	"strings"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
)

var (
	WsClients   = make(map[string]map[*websocket.Conn]bool)
	WsMutex     sync.RWMutex
	WsCloseOnce = make(map[*websocket.Conn]bool)

	CollegeSubscribers = make(map[string]map[*websocket.Conn]bool)
	CollegeMutex       sync.RWMutex

	ConnMutexes  = make(map[*websocket.Conn]*sync.Mutex)
	GlobalConnMu sync.Mutex
)

func getConnMutex(conn *websocket.Conn) *sync.Mutex {
	GlobalConnMu.Lock()
	defer GlobalConnMu.Unlock()
	if mu, ok := ConnMutexes[conn]; ok {
		return mu
	}
	mu := &sync.Mutex{}
	ConnMutexes[conn] = mu
	return mu
}

func safeWriteJSON(conn *websocket.Conn, v interface{}) error {
	mu := getConnMutex(conn)
	mu.Lock()
	defer mu.Unlock()
	return conn.WriteJSON(v)
}

func RegisterClient(country string, conn *websocket.Conn) {
	WsMutex.Lock()
	if WsClients[country] == nil {
		WsClients[country] = make(map[*websocket.Conn]bool)
	}
	WsClients[country][conn] = true
	WsMutex.Unlock()
}

func UnregisterClient(country string, conn *websocket.Conn) {
	WsMutex.Lock()
	delete(WsClients[country], conn)
	WsMutex.Unlock()
}

func SendCollegesUpdate(country string, conn *websocket.Conn) {
	cleanCountry := regexp.QuoteMeta(strings.TrimSpace(country))
	cursor, err := config.CollegeCollection.Find(context.TODO(), bson.M{
		"country":         bson.M{"$regex": "^" + cleanCountry + "$", "$options": "i"},
		"approval_status": "approved",
	})

	if err != nil {
		log.Printf(" Error fetching colleges: %v", err)
		return
	}
	defer cursor.Close(context.TODO())

	var colleges []map[string]interface{}
	for cursor.Next(context.TODO()) {
		var college models.CollegeStats
		if err := cursor.Decode(&college); err == nil {
			colleges = append(colleges, map[string]interface{}{
				"id":      college.CollegeName,
				"name":    college.CollegeName,
				"country": country,
				"data":    college.StudentStatistics,
			})
		}
	}

	message := map[string]interface{}{
		"type":     "colleges_update",
		"colleges": colleges,
		"country":  country,
		"count":    len(colleges),
	}

	if err := safeWriteJSON(conn, message); err != nil {
		log.Printf(" Error sending colleges update: %v", err)
	}
}

func BroadcastNewCollege(country string, college map[string]interface{}) {
	WsMutex.RLock()
	clients := WsClients[country]
	WsMutex.RUnlock()

	if len(clients) == 0 {
		return
	}

	message := map[string]interface{}{
		"type":    "new_college",
		"college": college,
		"country": country,
	}

	WsMutex.Lock()
	for client := range clients {
		if err := safeWriteJSON(client, message); err != nil {
			log.Printf(" Error broadcasting new college: %v", err)
		}
	}
	WsMutex.Unlock()
}

func SendCountriesUpdate(conn *websocket.Conn) {
	cursor, err := config.CollegeCollection.Find(context.TODO(), bson.M{
		"approval_status": "approved",
	})

	if err != nil {
		log.Printf(" Error fetching countries: %v", err)
		return
	}
	defer cursor.Close(context.TODO())

	countryMap := make(map[string]bool)
	var countries []map[string]interface{}

	for cursor.Next(context.TODO()) {
		var college models.CollegeStats
		if err := cursor.Decode(&college); err == nil {
			if !countryMap[college.Country] {
				countryMap[college.Country] = true
				countries = append(countries, map[string]interface{}{
					"id":   college.Country,
					"name": college.Country,
				})
			}
		}
	}

	message := map[string]interface{}{
		"type":      "countries_update",
		"countries": countries,
		"count":     len(countries),
	}

	if err := safeWriteJSON(conn, message); err != nil {
		log.Printf(" Error sending countries update: %v", err)
	}
	log.Printf(" Sent %d countries to client", len(countries))
}

var (
	AdminClients = make(map[*websocket.Conn]bool)
	AdminMutex   sync.RWMutex
)

func RegisterAdminClient(conn *websocket.Conn) {
	AdminMutex.Lock()
	AdminClients[conn] = true
	AdminMutex.Unlock()
	log.Printf(" Admin client connected (total: %d)", len(AdminClients))
}

func UnregisterAdminClient(conn *websocket.Conn) {
	AdminMutex.Lock()
	delete(AdminClients, conn)
	AdminMutex.Unlock()
	log.Printf(" Admin client disconnected (total: %d)", len(AdminClients))
}

func BroadcastAdminUpdate(eventType string, data map[string]interface{}) {
	AdminMutex.RLock()
	clients := make([]*websocket.Conn, 0, len(AdminClients))
	for client := range AdminClients {
		clients = append(clients, client)
	}
	AdminMutex.RUnlock()

	if len(clients) == 0 {
		return
	}

	message := map[string]interface{}{
		"type":      eventType,
		"data":      data,
		"timestamp": time.Now(),
	}

	AdminMutex.Lock()
	for _, client := range clients {
		if err := safeWriteJSON(client, message); err != nil {
			log.Printf(" Error broadcasting to admin client: %v", err)
			delete(AdminClients, client)
		}
	}
	AdminMutex.Unlock()

	log.Printf(" Broadcasted %s to %d admin clients", eventType, len(clients))
}

func BroadcastCollegeApproved(collegeName, approvedBy string) {
	BroadcastAdminUpdate("college_approved", map[string]interface{}{
		"college_name": collegeName,
		"approved_by":  approvedBy,
	})
}

func BroadcastCollegeRejected(collegeName string) {
	BroadcastAdminUpdate("college_rejected", map[string]interface{}{
		"college_name": collegeName,
	})
}

func BroadcastUserCreated(email, role string) {
	BroadcastAdminUpdate("user_created", map[string]interface{}{
		"email": email,
		"role":  role,
	})
}

func BroadcastUserDeleted(email string) {
	BroadcastAdminUpdate("user_deleted", map[string]interface{}{
		"email": email,
	})
}

func BroadcastRedisUpdate(action string, count int) {
	BroadcastAdminUpdate("redis_update", map[string]interface{}{
		"action": action,
		"count":  count,
	})
}

var (
	StudentClients = make(map[string]*websocket.Conn)
	StudentMutex   sync.RWMutex
)

func RegisterStudentClient(userID string, conn *websocket.Conn) {
	StudentMutex.Lock()
	StudentClients[userID] = conn
	StudentMutex.Unlock()
	log.Printf(" Student client connected: %s (total: %d)", userID, len(StudentClients))
}

func UnregisterStudentClient(userID string) {
	StudentMutex.Lock()
	delete(StudentClients, userID)
	StudentMutex.Unlock()
	log.Printf(" Student client disconnected: %s (total: %d)", userID, len(StudentClients))
}

func BroadcastTestApproval(userID, testType string) {
	StudentMutex.RLock()
	conn, exists := StudentClients[userID]
	StudentMutex.RUnlock()

	if !exists {
		log.Printf(" No WebSocket connection for user %s", userID)
		return
	}

	message := map[string]interface{}{
		"type":    testType + "_approval",
		"user_id": userID,
	}

	if err := safeWriteJSON(conn, message); err != nil {
		log.Printf(" Error sending approval to user %s: %v", userID, err)
		UnregisterStudentClient(userID)
	} else {
		log.Printf(" Sent %s approval to user %s", testType, userID)
	}
}

func BroadcastMBTIApproval(userID string) {
	BroadcastTestApproval(userID, "mbti")
}

func BroadcastCognitiveApproval(userID string) {
	BroadcastTestApproval(userID, "cognitive")
}

func BroadcastPESCIOApproval(userID string) {
	BroadcastTestApproval(userID, "pescio")
}

func BroadcastPsychometricApproval(userID string) {
	BroadcastTestApproval(userID, "psychometric")
}

func BroadcastBehavioralApproval(userID string) {
	BroadcastTestApproval(userID, "behavioral")
}

func normalizeCollegeKey(name string) string {
	name = strings.ToLower(strings.TrimSpace(name))
	name = strings.ReplaceAll(name, "-", " ")
	name = strings.ReplaceAll(name, "_", " ")
	words := strings.Fields(name)
	return strings.Join(words, " ")
}

func RegisterCollegeSubscriber(collegeName string, conn *websocket.Conn) {
	CollegeMutex.Lock()
	defer CollegeMutex.Unlock()

	collegeName = normalizeCollegeKey(collegeName)
	if CollegeSubscribers[collegeName] == nil {
		CollegeSubscribers[collegeName] = make(map[*websocket.Conn]bool)
	}
	CollegeSubscribers[collegeName][conn] = true
	log.Printf(" Client subscribed to college: %s", collegeName)
}

func UnregisterCollegeSubscriber(collegeName string, conn *websocket.Conn) {
	CollegeMutex.Lock()
	defer CollegeMutex.Unlock()

	collegeName = normalizeCollegeKey(collegeName)
	if clients, ok := CollegeSubscribers[collegeName]; ok {
		delete(clients, conn)
		if len(clients) == 0 {
			delete(CollegeSubscribers, collegeName)
		}
	}
	log.Printf(" Client unsubscribed from college: %s", collegeName)
}

// Target specific college update for all clients watching that college
func BroadcastCollegeScrapingUpdate(collegeName string, updateType string, data interface{}) {
	message := map[string]interface{}{
		"type":         "scraping_update",
		"college_name": collegeName,
		"update_type":  updateType,
		"data":         data,
		"timestamp":    time.Now(),
	}

	// Send to specific college subscribers
	searchKey := normalizeCollegeKey(collegeName)
	CollegeMutex.RLock()
	if subscribers, ok := CollegeSubscribers[searchKey]; ok {
		for conn := range subscribers {
			if err := safeWriteJSON(conn, message); err != nil {
				log.Printf(" Error broadcasting to subscriber for %s: %v", collegeName, err)
			}
		}
	}
	CollegeMutex.RUnlock()

	// Also send to global "colleges" listeners for general updates
	WsMutex.RLock()
	for _, clients := range WsClients {
		for conn := range clients {
			if err := safeWriteJSON(conn, message); err != nil {
				log.Printf(" Error broadcasting general scraping update: %v", err)
			}
		}
	}
	WsMutex.RUnlock()

	// Also send to admins
	AdminMutex.RLock()
	for conn := range AdminClients {
		if err := safeWriteJSON(conn, message); err != nil {
			log.Printf(" Error broadcasting scraping update to admin: %v", err)
		}
	}
	AdminMutex.RUnlock()
}
