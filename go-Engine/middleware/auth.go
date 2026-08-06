package middleware

import (
	"context"
	"net/http"
	"strings"

	authsvc "gobackend/services/auth"
	"gobackend/utils"
)

type contextKey string

const (
	UserIDKey    contextKey = "user_id"
	UserEmailKey contextKey = "email"
	UserRoleKey  contextKey = "role"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Clean incoming header values to prevent external header spoofing
		r.Header.Del("X-User-ID")
		r.Header.Del("X-User-Email")
		r.Header.Del("X-User-Role")

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Authorization header required",
			})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Invalid authorization format",
			})
			return
		}

		token := parts[1]

		claims, err := authsvc.ValidateJWT(token)
		if err != nil {
			utils.RespondJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Invalid or expired token",
			})
			return
		}

		var userID, email, role string
		if val, ok := (*claims)["user_id"].(string); ok {
			userID = val
		} else if val, ok := (*claims)["id"].(string); ok {
			userID = val
		}
		if val, ok := (*claims)["email"].(string); ok {
			email = val
		}
		if val, ok := (*claims)["role"].(string); ok {
			role = val
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		ctx = context.WithValue(ctx, UserEmailKey, email)
		ctx = context.WithValue(ctx, UserRoleKey, role)

		r.Header.Set("X-User-ID", userID)
		r.Header.Set("X-User-Email", email)
		r.Header.Set("X-User-Role", role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AdminMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, ok := r.Context().Value(UserRoleKey).(string)
		if !ok || role != "admin" {
			utils.RespondJSON(w, http.StatusForbidden, map[string]string{
				"error": "Admin access required",
			})
			return
		}

		next.ServeHTTP(w, r)
	})
}
