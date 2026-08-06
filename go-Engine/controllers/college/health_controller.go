package college

import (
"net/http"

"gobackend/utils"
)

func HealthCheck(w http.ResponseWriter, r *http.Request) {
utils.RespondJSON(w, http.StatusOK, map[string]string{
"status":  "healthy",
"backend": "Go",
"version": "1.0.0",
})
}
