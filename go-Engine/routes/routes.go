package routes

import (
	"gobackend/middleware"
	adminroutes "gobackend/routes/admin"
	collegeroutes "gobackend/routes/college"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gorilla/mux"
)

func SetupRoutes() *mux.Router {
	r := mux.NewRouter()
	r.Use(middleware.CorsMiddleware)

	setupAssessmentRoutes(r)
	setupBaseRoutes(r)
	setupAuthRoutes(r)
	collegeroutes.RegisterCollegeRoutes(r)
	adminroutes.RegisterAdminRoutes(r)
	setupGreProxy(r)
	setupScraperProxy(r)

	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/",
		http.FileServer(http.Dir("../App/static"))))

	return r
}

func setupGreProxy(r *mux.Router) {
	greURLStr := os.Getenv("GRE_BACKEND_URL")
	if greURLStr == "" {
		greURLStr = "http://localhost:11000"
	}
	targetURL, err := url.Parse(greURLStr)
	if err != nil {
		return
	}

	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Header.Set("X-Forwarded-Host", req.Header.Get("Host"))
		req.Host = targetURL.Host
	}

	// Strip backend CORS headers to prevent duplicate headers in response
	proxy.ModifyResponse = func(resp *http.Response) error {
		resp.Header.Del("Access-Control-Allow-Origin")
		resp.Header.Del("Access-Control-Allow-Credentials")
		resp.Header.Del("Access-Control-Allow-Headers")
		resp.Header.Del("Access-Control-Allow-Methods")
		return nil
	}

	proxyHandler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		proxy.ServeHTTP(w, req)
	})

	prefixes := []string{
		"/api/admin/tickets",
		"/api/tickets",
		"/api/admin/questions",
		"/api/questions",
		"/api/admin/gre",
		"/api/admin/audit-trail",
		"/api/admin/allocations",
		"/api/allocations",
		"/api/exam",
		"/api/results",
		"/api/gre",
		"/api/analytics",
	}

	for _, p := range prefixes {
		r.PathPrefix(p).Handler(proxyHandler)
	}
}

func setupScraperProxy(r *mux.Router) {
	scraperURLStr := os.Getenv("SCRAPER_URL")
	if scraperURLStr == "" {
		scraperURLStr = "http://localhost:5000"
	}
	targetURL, err := url.Parse(scraperURLStr)
	if err != nil {
		return
	}

	proxy := httputil.NewSingleHostReverseProxy(targetURL)

	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Header.Set("X-Forwarded-Host", req.Header.Get("Host"))
		req.Host = targetURL.Host
	}

	proxyHandler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		proxy.ServeHTTP(w, req)
	})

	prefixes := []string{
		"/api/scrape",
		"/api/dontsettle",
	}

	for _, p := range prefixes {
		r.PathPrefix(p).Handler(proxyHandler)
	}
}
