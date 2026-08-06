package adminroutes

import (
	"gobackend/controllers/admin"

	"github.com/gorilla/mux"
)

func RegisterRedisRoutes(adminRouter *mux.Router) {
	adminRouter.HandleFunc("/redis/populate", admin.PopulateRedis).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/redis/clear", admin.ClearRedis).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/redis/stats", admin.GetRedisStats).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/redis/sync/{name}", admin.SyncCollegeWithRedis).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/redis/colleges", admin.GetAllCachedColleges).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/redis/delete/{name}", admin.DeleteCachedCollege).Methods("DELETE", "OPTIONS")
}
