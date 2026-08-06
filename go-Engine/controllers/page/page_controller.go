package page

import (
	"net/http"
	"os"
	"path/filepath"
)

func getTemplatePath(fallback string) string {
	if custom := os.Getenv("TEMPLATE_PATH"); custom != "" {
		return custom
	}
	cwd, err := os.Getwd()
	if err == nil {
		path := filepath.Join(cwd, fallback)
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	return fallback
}

func HomePage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, getTemplatePath("../App/templates/university/college_statistics.html"))
}

func CollegeStatsPage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, getTemplatePath("../App/templates/university/college_statistics.html"))
}
