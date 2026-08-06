package middleware

import (
	"log"
	"net/http"
	"strings"
)

// Allowed origins for CORS
var AllowedOrigins = map[string]bool{
	// Local development
	"http://localhost:3000": true,
	"http://localhost:3001": true,
	"http://localhost:7000": true,
	"http://localhost:9000": true,
	"http://localhost:8501": true,
	"http://127.0.0.1:3000": true,
	"http://127.0.0.1:3001": true,
	"http://127.0.0.1:7000": true,
	"http://127.0.0.1:9000": true,
	"http://127.0.0.1:8501": true,
	// Production domains
	"https://ai.cloudlab.works":  true,
	"https://tru.cloudlab.works": true,
	"https://api.cloudlab.works": true,
}

func CorsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// WebSocket upgrade requests must NOT have response headers written before
		// gorilla/websocket calls Upgrade() — skip CORS injection for WS paths.
		isWebSocket := strings.EqualFold(r.Header.Get("Upgrade"), "websocket")
		if isWebSocket {
			next.ServeHTTP(w, r)
			return
		}

		origin := r.Header.Get("Origin")

		isAllowed := AllowedOrigins[origin]
		if !isAllowed && origin != "" {
			if strings.HasSuffix(origin, ".cloudlab.works") || origin == "https://cloudlab.works" {
				isAllowed = true
			}
		}

		// Check if origin is in whitelist
		if isAllowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Max-Age", "3600")
		} else if origin != "" {
			// Log rejected requests for security audit
			log.Printf("  SECURITY: Rejected CORS request from unauthorized origin: %s | Path: %s | Method: %s", origin, r.URL.Path, r.Method)
		}

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
