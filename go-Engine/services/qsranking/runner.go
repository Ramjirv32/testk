package qsranking

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"gobackend/models"
)

var ErrAlreadyRunning = errors.New("QS rankings orchestrator is already running")

type RunStatus struct {
	Running           bool       `json:"running"`
	PID               int        `json:"pid,omitempty"`
	Script            string     `json:"script"`
	LogPath           string     `json:"log_path"`
	StartedAt         *time.Time `json:"started_at,omitempty"`
	FinishedAt        *time.Time `json:"finished_at,omitempty"`
	ExitCode          *int       `json:"exit_code,omitempty"`
	ImportedCount     int        `json:"imported_count,omitempty"`
	ImportedProfiles  int        `json:"imported_profiles,omitempty"`
	LastError         string     `json:"last_error,omitempty"`
	SettingsUpdatedAt *time.Time `json:"settings_updated_at,omitempty"`
}

var runnerState = struct {
	sync.Mutex
	status RunStatus
	cmd    *exec.Cmd
}{status: RunStatus{Script: "qs_rankings_orchestrator.py"}}

func GetRunStatus() RunStatus {
	runnerState.Lock()
	defer runnerState.Unlock()
	return runnerState.status
}

func StartOrchestrator(settings *models.QSScraperSettings) (RunStatus, error) {
	runnerState.Lock()
	defer runnerState.Unlock()

	if runnerState.status.Running {
		return runnerState.status, ErrAlreadyRunning
	}

	projectRoot, err := findProjectRoot()
	if err != nil {
		return runnerState.status, err
	}
	scriptPath := filepath.Join(projectRoot, "scrapers", "portals", "qs", "qs_rankings_orchestrator.py")
	if _, err := os.Stat(scriptPath); err != nil {
		return runnerState.status, fmt.Errorf("QS rankings orchestrator not found at %s: %w", scriptPath, err)
	}

	logDir := filepath.Join(projectRoot, "logs")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return runnerState.status, fmt.Errorf("create QS log directory: %w", err)
	}
	logPath := filepath.Join(logDir, "qs_rankings_orchestrator.log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return runnerState.status, fmt.Errorf("open QS log file: %w", err)
	}

	cmd := exec.Command("python3", "-u", scriptPath)
	cmd.Dir = projectRoot
	cmd.Stdout = logFile
	cmd.Stderr = logFile
	cmd.Env = append(os.Environ(),
		"QS_MANAGED_BY_GO_ENGINE=1",
		"QS_BASE_URL="+settings.BaseURL,
		"QS_START_PAGE="+strconv.Itoa(settings.StartPage),
		"QS_END_PAGE="+strconv.Itoa(settings.EndPage),
		"QS_PAGER_LIMIT="+strconv.Itoa(settings.PagerLimit),
		"QS_WAIT_MS="+strconv.Itoa(settings.WaitMS),
		"QS_PAGE_TIMEOUT_MS="+strconv.Itoa(settings.PageTimeoutMS),
	)

	if err := cmd.Start(); err != nil {
		logFile.Close()
		return runnerState.status, fmt.Errorf("start QS rankings orchestrator: %w", err)
	}

	now := time.Now().UTC()
	runnerState.status = RunStatus{
		Running:           true,
		PID:               cmd.Process.Pid,
		Script:            filepath.Base(scriptPath),
		LogPath:           logPath,
		StartedAt:         &now,
		SettingsUpdatedAt: &settings.UpdatedAt,
	}
	runnerState.cmd = cmd

	go waitForOrchestrator(cmd, logFile)
	return runnerState.status, nil
}

func waitForOrchestrator(cmd *exec.Cmd, logFile *os.File) {
	err := cmd.Wait()
	finishedAt := time.Now().UTC()
	exitCode := cmd.ProcessState.ExitCode()
	importedCount := 0
	importedProfiles := 0
	importError := ""
	if exitCode == 0 {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		importedCount, err = ImportDefaultRankings(ctx)
		if err != nil {
			importError = err.Error()
			_, _ = fmt.Fprintf(logFile, "MongoDB import failed: %s\n", importError)
		} else {
			_, _ = fmt.Fprintf(logFile, "MongoDB import complete: %d ranked universities\n", importedCount)
			importedProfiles, err = ImportDefaultProfiles(ctx)
			if err != nil {
				importError = err.Error()
				_, _ = fmt.Fprintf(logFile, "MongoDB profile import failed: %s\n", importError)
			} else {
				_, _ = fmt.Fprintf(logFile, "MongoDB profile import complete: %d university profiles\n", importedProfiles)
			}
		}
		cancel()
	}
	_, _ = fmt.Fprintf(logFile, "\n[%s] QS rankings orchestrator finished with exit code %d\n", finishedAt.Format(time.RFC3339), exitCode)
	_ = logFile.Close()

	runnerState.Lock()
	defer runnerState.Unlock()
	runnerState.status.Running = false
	runnerState.status.FinishedAt = &finishedAt
	runnerState.status.ExitCode = &exitCode
	runnerState.status.ImportedCount = importedCount
	runnerState.status.ImportedProfiles = importedProfiles
	runnerState.cmd = nil
	if err != nil {
		runnerState.status.LastError = err.Error()
	} else if importError != "" {
		runnerState.status.LastError = importError
	}
}

func AbortOrchestrator() (RunStatus, error) {
	runnerState.Lock()
	defer runnerState.Unlock()
	if !runnerState.status.Running || runnerState.cmd == nil || runnerState.cmd.Process == nil {
		return runnerState.status, errors.New("no active QS rankings orchestrator")
	}
	if err := runnerState.cmd.Process.Kill(); err != nil {
		return runnerState.status, fmt.Errorf("abort QS rankings orchestrator: %w", err)
	}
	return runnerState.status, nil
}

func findProjectRoot() (string, error) {
	if configured := os.Getenv("BROWSEROS_PROJECT_ROOT"); configured != "" {
		return filepath.Abs(configured)
	}

	current, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("get current directory: %w", err)
	}
	for {
		candidate := filepath.Join(current, "scrapers", "portals", "qs", "qs_rankings_orchestrator.py")
		if _, err := os.Stat(candidate); err == nil {
			return current, nil
		}
		parent := filepath.Dir(current)
		if parent == current {
			break
		}
		current = parent
	}
	return "", fmt.Errorf("could not locate BrowserOS project root; set BROWSEROS_PROJECT_ROOT")
}
