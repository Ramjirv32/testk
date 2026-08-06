package college

import (
	"log"
	"net/http"

	collegesvc "gobackend/services/college"
	"gobackend/utils"
)

func GetCountries(w http.ResponseWriter, r *http.Request) {
	countries, err := collegesvc.GetDistinctCountries()
	if err != nil {
		log.Printf(" Error fetching countries: %v", err)
		defaultCountries := []map[string]string{
			{"id": "1", "name": "India"},
			{"id": "2", "name": "United States"},
			{"id": "3", "name": "United Kingdom"},
			{"id": "4", "name": "Canada"},
			{"id": "5", "name": "Australia"},
			{"id": "6", "name": "Germany"},
			{"id": "7", "name": "France"},
			{"id": "8", "name": "Japan"},
			{"id": "9", "name": "China"},
			{"id": "10", "name": "Singapore"},
		}
		utils.RespondJSON(w, http.StatusOK, defaultCountries)
		return
	}

	countryList := make([]map[string]string, 0)
	for i, country := range countries {
		if country != nil && country != "" {
			countryList = append(countryList, map[string]string{
				"id":   string(rune(i + 49)),
				"name": country.(string),
			})
		}
	}

	// If we have absolutely no countries, supplement with defaults
	if len(countryList) == 0 {
		defaultCountries := []map[string]string{
			{"id": "1", "name": "India"},
			{"id": "2", "name": "United States"},
			{"id": "3", "name": "United Kingdom"},
			{"id": "4", "name": "Canada"},
			{"id": "5", "name": "Australia"},
			{"id": "6", "name": "Germany"},
			{"id": "7", "name": "France"},
			{"id": "8", "name": "Japan"},
			{"id": "9", "name": "China"},
			{"id": "10", "name": "Singapore"},
		}
		utils.RespondJSON(w, http.StatusOK, defaultCountries)
		return
	}

	utils.RespondJSON(w, http.StatusOK, countryList)
}

func GetCollegesByCountry(w http.ResponseWriter, r *http.Request) {
	country := r.URL.Query().Get("country")
	if country == "" {
		utils.RespondJSON(w, http.StatusBadRequest, map[string]string{"error": "country parameter required"})
		return
	}

	colleges, err := collegesvc.GetCollegesByCountry(country)
	if err != nil {
		log.Printf(" Error fetching colleges: %v", err)
		utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch colleges"})
		return
	}

	collegeList := make([]map[string]interface{}, 0)
	for _, college := range colleges {
		collegeList = append(collegeList, map[string]interface{}{
			"id":      college.CollegeName,
			"name":    college.CollegeName,
			"country": country,
			"data":    college.StudentStatistics,
		})
	}

	utils.RespondJSON(w, http.StatusOK, collegeList)
}
