package admin

import (
	"net/http"

	collegesvc "gobackend/services/college"
	"gobackend/utils"
)

func GetAdminDashboardStats(w http.ResponseWriter, r *http.Request) {
	pendingColleges, _ := collegesvc.GetPendingColleges()
	approvedColleges, _ := collegesvc.GetApprovedColleges()
	redisStats, _ := redisService.GetRedisStats()

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"pending_count":  len(pendingColleges),
		"approved_count": len(approvedColleges),
		"redis_stats":    redisStats,
	})
}
