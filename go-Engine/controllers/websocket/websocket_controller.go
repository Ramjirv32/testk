package ws

import (
	"log"
	"net/http"
	"time"

	authsvc "gobackend/services/auth"
	collegesvc "gobackend/services/college"
	"gobackend/services/realtime"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebSocketColleges(w http.ResponseWriter, r *http.Request) {
	country := r.URL.Query().Get("country")
	if country == "" {
		http.Error(w, "country parameter required", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf(" WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf(" WebSocket client connected for country: %s", country)

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	realtime.RegisterClient(country, conn)
	realtime.SendCollegesUpdate(country, conn)

	done := make(chan struct{})
	defer close(done)

	go func() {
		ticker := time.NewTicker(25 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			case <-done:
				return
			}
		}
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf(" WebSocket error for %s: %v", country, err)
			}
			break
		}
	}

	realtime.UnregisterClient(country, conn)
	log.Printf(" WebSocket client disconnected for country: %s", country)
}

func HandleWebSocketCountries(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf(" WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf(" WebSocket client connected for countries updates")

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	realtime.SendCountriesUpdate(conn)

	done := make(chan struct{})
	defer close(done)

	go func() {
		ticker := time.NewTicker(25 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			case <-done:
				return
			}
		}
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf(" WebSocket error for countries: %v", err)
			}
			break
		}
	}

	log.Printf(" WebSocket client disconnected for countries")
}

func HandleWebSocketAdmin(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		log.Printf(" Admin WebSocket connection rejected: token missing")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	claims, err := authsvc.ValidateJWT(token)
	if err != nil || claims == nil {
		log.Printf(" Admin WebSocket connection rejected: invalid token: %v", err)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	role, _ := (*claims)["role"].(string)
	if role != "admin" {
		log.Printf(" Admin WebSocket connection rejected: user role is %s (expected admin)", role)
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf(" WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf(" Admin WebSocket client connected")

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	realtime.RegisterAdminClient(conn)
	defer realtime.UnregisterAdminClient(conn)

	sendInitialAdminStats(conn)

	done := make(chan struct{})
	defer close(done)

	go func() {
		ticker := time.NewTicker(25 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			case <-done:
				return
			}
		}
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf(" WebSocket error for admin: %v", err)
			}
			return
		}
	}
}

func sendInitialAdminStats(conn *websocket.Conn) {
	pendingColleges, _ := collegesvc.GetPendingColleges()
	approvedColleges, _ := collegesvc.GetApprovedColleges()

	message := map[string]interface{}{
		"type": "initial_stats",
		"data": map[string]interface{}{
			"pending_count":  len(pendingColleges),
			"approved_count": len(approvedColleges),
		},
	}

	if err := conn.WriteJSON(message); err != nil {
		log.Printf(" Error sending initial admin stats: %v", err)
	}
}

func HandleWebSocketStudent(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "user_id parameter required", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf(" WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf(" Student WebSocket client connected: %s", userID)

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	realtime.RegisterStudentClient(userID, conn)
	defer realtime.UnregisterStudentClient(userID)

	done := make(chan struct{})
	defer close(done)

	go func() {
		ticker := time.NewTicker(25 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			case <-done:
				return
			}
		}
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure, websocket.CloseNoStatusReceived) {
				log.Printf(" WebSocket error for student %s: %v", userID, err)
			}
			return
		}
	}
}

func HandleWebSocketCollegeDetails(w http.ResponseWriter, r *http.Request) {
	name := mux.Vars(r)["name"]
	if name == "" {
		http.Error(w, "college name required", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf(" WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Printf(" WebSocket client subscribed to details for: %s", name)

	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	realtime.RegisterCollegeSubscriber(name, conn)
	defer realtime.UnregisterCollegeSubscriber(name, conn)

	// Send initial data if exists
	if stats, err := collegesvc.GetCollegeFromCache(name); err == nil && stats != nil {
		message := map[string]interface{}{
			"type": "initial_data",
			"data": stats,
		}
		if pipeline, pipelineErr := collegesvc.GetLatestCollegePipeline(name); pipelineErr == nil {
			message["pipeline_id"] = pipeline.ID
			message["pipeline_status"] = pipeline.Status
		}
		conn.WriteJSON(message)
	}

	done := make(chan struct{})
	defer close(done)

	go func() {
		ticker := time.NewTicker(25 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					return
				}
			case <-done:
				return
			}
		}
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			return
		}
	}
}
