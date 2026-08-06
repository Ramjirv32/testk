package admin

import (
	"encoding/json"
	"log"
	"net/http"

	"gobackend/models"
	collegesvc "gobackend/services/college"
	"gobackend/services/messaging"
	"gobackend/services/realtime"
	"gobackend/utils"

	"github.com/gorilla/mux"
)

func GetPendingColleges(w http.ResponseWriter, r *http.Request) {
	colleges, err := collegesvc.GetPendingColleges()
	if err != nil {
		log.Printf(" Error fetching pending colleges: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to fetch pending colleges",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"count":    len(colleges),
		"colleges": colleges,
	})
}

func ApproveCollege(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collegeName := vars["name"]

	if collegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "College name required",
		})
		return
	}

	adminEmail := r.Header.Get("X-User-Email")

	err := collegesvc.ApproveCollege(collegeName, adminEmail)
	if err != nil {
		log.Printf(" Error approving college: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to approve college",
		})
		return
	}

	college, err := collegesvc.GetApprovedCollegeByName(collegeName)
	if err != nil {
		log.Printf(" College approved but failed to fetch: %v", err)
	} else {
		if err := messaging.PublishCollegeUpdated(collegeName); err != nil {
			log.Printf(" Failed to publish RabbitMQ event: %v", err)
		}

		collegeData := map[string]interface{}{
			"id":      college.CollegeName,
			"name":    college.CollegeName,
			"country": college.Country,
			"data":    college.StudentStatistics,
		}
		realtime.BroadcastNewCollege(college.Country, collegeData)
		realtime.BroadcastCollegeApproved(collegeName, adminEmail)
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "College approved successfully",
		"college": collegeName,
	})
}

func RejectCollege(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collegeName := vars["name"]

	if collegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "College name required",
		})
		return
	}

	err := collegesvc.RejectCollege(collegeName)
	if err != nil {
		log.Printf(" Error rejecting college: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to reject college",
		})
		return
	}

	redisService.DeleteCollegeFromRedis(collegeName)

	realtime.BroadcastCollegeRejected(collegeName)

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "College rejected successfully",
		"college": collegeName,
	})
}

func DeleteCollege(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collegeName := vars["name"]

	if collegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "College name required",
		})
		return
	}

	err := collegesvc.DeleteCollege(collegeName)
	if err != nil {
		log.Printf(" Error deleting college: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to delete college",
		})
		return
	}

	if err := messaging.PublishCollegeUpdated(collegeName); err != nil {
		log.Printf(" Failed to publish RabbitMQ event: %v", err)
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "College deleted successfully",
		"college": collegeName,
	})
}

func SyncCollegeWithRedis(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	collegeName := vars["name"]

	if collegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "College name required",
		})
		return
	}

	err := redisService.CompareAndSyncWithDB(collegeName)
	if err != nil {
		log.Printf(" Error syncing college: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to sync college",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "College synced successfully",
		"college": collegeName,
	})
}

func GetAllApprovedColleges(w http.ResponseWriter, r *http.Request) {
	colleges, err := collegesvc.GetApprovedColleges()
	if err != nil {
		log.Printf(" Error fetching approved colleges: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to fetch approved colleges",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"count":    len(colleges),
		"colleges": colleges,
	})
}

func UpdateCollege(w http.ResponseWriter, r *http.Request) {
	var college models.CollegeStats
	if err := json.NewDecoder(r.Body).Decode(&college); err != nil {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid request body",
		})
		return
	}

	if college.CollegeName == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "College name is required",
		})
		return
	}

	err := collegesvc.UpdateCollege(&college)
	if err != nil {
		log.Printf(" Error updating college: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to update college",
		})
		return
	}

	if err := redisService.DeleteCollegeFromRedis(college.CollegeName); err != nil {
		log.Printf(" Failed to delete college from Redis cache: %v", err)
	} else {
		log.Printf(" Immediately invalidated Redis cache for: %s", college.CollegeName)
	}

	if err := messaging.PublishCollegeUpdated(college.CollegeName); err != nil {
		log.Printf(" Failed to publish RabbitMQ event: %v", err)
	} else {
		log.Printf(" Published cache update event via RabbitMQ for: %s", college.CollegeName)
	}

	utils.RespondJSON(w, http.StatusOK, map[string]string{
		"message": "College updated successfully",
		"college": college.CollegeName,
	})
}
