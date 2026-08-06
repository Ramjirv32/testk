package routes

import (
	ws "gobackend/controllers/websocket"

	"github.com/gorilla/mux"
)

func setupWebSocketRoutes(r *mux.Router) {
	r.HandleFunc("/ws/colleges", ws.HandleWebSocketColleges)
	r.HandleFunc("/ws/countries", ws.HandleWebSocketCountries)
	r.HandleFunc("/ws/admin", ws.HandleWebSocketAdmin)
	r.HandleFunc("/ws/college-details/{name}", ws.HandleWebSocketCollegeDetails)
	r.HandleFunc("/ws", ws.HandleWebSocketStudent)
}
