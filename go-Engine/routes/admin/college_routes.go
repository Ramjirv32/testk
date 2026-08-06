package adminroutes

import (
	"gobackend/controllers/admin"

	"github.com/gorilla/mux"
)

func RegisterCollegeRoutes(adminRouter *mux.Router) {
	adminRouter.HandleFunc("/pending-colleges", admin.GetPendingColleges).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/approved-colleges", admin.GetAllApprovedColleges).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/approve/{name}", admin.ApproveCollege).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/reject/{name}", admin.RejectCollege).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/delete/{name}", admin.DeleteCollege).Methods("DELETE", "OPTIONS")
	adminRouter.HandleFunc("/update-college", admin.UpdateCollege).Methods("PUT", "OPTIONS")
	adminRouter.HandleFunc("/stats", admin.GetAdminDashboardStats).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/college-pipeline/force", admin.ForceCollegePipeline).Methods("POST", "OPTIONS")
}
