package admin

import (
	"log"
	"net/http"

	authsvc "gobackend/services/auth"
	"gobackend/services/realtime"
	"gobackend/utils"

	"github.com/gorilla/mux"
)

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := authsvc.GetAllUsers()
	if err != nil {
		log.Printf(" Error fetching users: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to fetch users",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"count": len(users),
		"users": users,
	})
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	email := vars["email"]

	if email == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Email required",
		})
		return
	}

	err := authsvc.DeleteUser(email)
	if err != nil {
		log.Printf(" Error deleting user: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to delete user",
		})
		return
	}

	realtime.BroadcastUserDeleted(email)

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "User deleted successfully",
		"email":   email,
	})
}
