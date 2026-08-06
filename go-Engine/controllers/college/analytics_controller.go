package college

import (
"log"
"net/http"
"strconv"

collegesvc "gobackend/services/college"
"gobackend/utils"
)

func GetMostSearchedColleges(w http.ResponseWriter, r *http.Request) {
limitStr := r.URL.Query().Get("limit")
limit := 10
if limitStr != "" {
if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
limit = parsedLimit
}
}

colleges, err := collegesvc.GetMostSearchedColleges(limit)
if err != nil {
log.Printf(" Error fetching most searched colleges: %v", err)
utils.RespondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch most searched colleges"})
return
}

utils.RespondJSON(w, http.StatusOK, colleges)
}
