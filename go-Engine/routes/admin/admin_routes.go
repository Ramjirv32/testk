package adminroutes

import (
	"github.com/gorilla/mux"
	"gobackend/middleware"
)

func RegisterAdminRoutes(r *mux.Router) {
	adminRouter := r.PathPrefix("/api/admin").Subrouter()
	adminRouter.Use(middleware.AuthMiddleware)
	adminRouter.Use(middleware.AdminMiddleware)

	RegisterUserRoutes(adminRouter)
	RegisterCollegeRoutes(adminRouter)
	RegisterRedisRoutes(adminRouter)
	RegisterAssessmentRoutes(adminRouter)
}
