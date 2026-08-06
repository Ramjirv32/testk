package admin

import (
	"log"
	"net/http"

	"gobackend/services/realtime"
	"gobackend/utils"

	"github.com/gorilla/mux"
)

func PopulateRedis(w http.ResponseWriter, r *http.Request) {
	count, err := redisService.PopulateRedisFromDB()
	if err != nil {
		log.Printf(" Error populating Redis: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to populate Redis",
		})
		return
	}

	realtime.BroadcastRedisUpdate("populate", count)

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Redis populated successfully",
		"count":   count,
	})
}

func ClearRedis(w http.ResponseWriter, r *http.Request) {
	err := redisService.ClearAllCollegesFromRedis()
	if err != nil {
		log.Printf(" Error clearing Redis: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to clear Redis",
		})
		return
	}

	realtime.BroadcastRedisUpdate("clear", 0)

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "Redis cleared successfully",
	})
}

func GetRedisStats(w http.ResponseWriter, r *http.Request) {
	stats, err := redisService.GetRedisStats()
	if err != nil {
		log.Printf(" Error getting Redis stats: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to get Redis stats",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, stats)
}

func GetAllCachedColleges(w http.ResponseWriter, r *http.Request) {
	colleges, err := redisService.GetAllCachedColleges()
	if err != nil {
		log.Printf(" Error fetching cached colleges: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to fetch cached colleges",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"count":    len(colleges),
		"colleges": colleges,
	})
}

func DeleteCachedCollege(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collegeName := vars["name"]

	if collegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "College name required",
		})
		return
	}

	err := redisService.DeleteCollegeFromRedis(collegeName)
	if err != nil {
		log.Printf(" Error deleting cached college: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to delete cached college",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "Cached college deleted successfully",
		"college": collegeName,
	})
}
