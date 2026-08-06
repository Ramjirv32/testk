package adminroutes

import (
	"gobackend/controllers/admin"

	"github.com/gorilla/mux"
)

func RegisterUserRoutes(adminRouter *mux.Router) {
	adminRouter.HandleFunc("/users", admin.GetAllUsers).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/users/{email}", admin.DeleteUser).Methods("DELETE", "OPTIONS")
}
