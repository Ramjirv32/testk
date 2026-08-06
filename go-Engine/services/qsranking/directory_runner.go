package qsranking

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"gobackend/models"
)

var ErrDirectoryAlreadyRunning = errors.New("university directory loader is already running")

var directoryRunner = struct {
	sync.Mutex
	status RunStatus
	cmd    *exec.Cmd
}{status: RunStatus{Script: "qs_directory_scraper.py"}}

func GetDirectoryRunStatus() RunStatus {
	directoryRunner.Lock()
	defer directoryRunner.Unlock()
	return directoryRunner.status
}

func StartDirectoryOrchestrator(settings *models.QSScraperSettings) (RunStatus, error) {
	directoryRunner.Lock()
	defer directoryRunner.Unlock()
	if directoryRunner.status.Running {
		return directoryRunner.status, ErrDirectoryAlreadyRunning
	}
	root, err := findProjectRoot()
	if err != nil {
		return directoryRunner.status, err
	}
	script := filepath.Join(root, "scrapers", "portals", "qs", "qs_directory_scraper.py")
	if _, err := os.Stat(script); err != nil {
		return directoryRunner.status, fmt.Errorf("directory scraper not found: %w", err)
	}
	logDir := filepath.Join(root, "logs")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return directoryRunner.status, err
	}
	logPath := filepath.Join(logDir, "qs_directory_scraper.log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return directoryRunner.status, err
	}
	workers := strings.TrimSpace(os.Getenv("QS_DIRECTORY_WORKERS"))
	if workers == "" {
		workers = "4"
	}
	cmd := exec.Command("python3", "-u", script, "--workers", workers)
	cmd.Dir = root
	cmd.Stdout = logFile
	cmd.Stderr = logFile
	cmd.Env = append(os.Environ(), "QS_DIRECTORY_MANAGED_BY_GO=1", "QS_DIRECTORY_BASE_URL="+settings.BaseURL, "QS_DIRECTORY_START_PAGE="+strconv.Itoa(settings.StartPage), "QS_DIRECTORY_END_PAGE="+strconv.Itoa(settings.EndPage), "QS_DIRECTORY_PAGER_LIMIT="+strconv.Itoa(settings.PagerLimit), "QS_DIRECTORY_WAIT_MS="+strconv.Itoa(settings.WaitMS), "QS_DIRECTORY_PAGE_TIMEOUT_MS="+strconv.Itoa(settings.PageTimeoutMS))
	if err := cmd.Start(); err != nil {
		logFile.Close()
		return directoryRunner.status, err
	}
	now := time.Now().UTC()
	directoryRunner.status = RunStatus{Running: true, PID: cmd.Process.Pid, Script: filepath.Base(script), LogPath: logPath, StartedAt: &now, SettingsUpdatedAt: &settings.UpdatedAt}
	directoryRunner.cmd = cmd
	go func() {
		err := cmd.Wait()
		finished := time.Now().UTC()
		code := cmd.ProcessState.ExitCode()
		imported := 0
		lastError := ""
		if code == 0 {
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
			imported, err = ImportDefaultDirectory(ctx)
			cancel()
		}
		if err != nil {
			lastError = err.Error()
			_, _ = fmt.Fprintf(logFile, "Directory import failed: %s\n", lastError)
		}
		_ = logFile.Close()
		directoryRunner.Lock()
		defer directoryRunner.Unlock()
		directoryRunner.status.Running = false
		directoryRunner.status.FinishedAt = &finished
		directoryRunner.status.ExitCode = &code
		directoryRunner.status.ImportedCount = imported
		directoryRunner.status.LastError = lastError
		directoryRunner.cmd = nil
	}()
	return directoryRunner.status, nil
}

func AbortDirectoryOrchestrator() (RunStatus, error) {
	directoryRunner.Lock()
	defer directoryRunner.Unlock()
	if !directoryRunner.status.Running || directoryRunner.cmd == nil || directoryRunner.cmd.Process == nil {
		return directoryRunner.status, errors.New("no active university directory loader")
	}
	if err := directoryRunner.cmd.Process.Kill(); err != nil {
		return directoryRunner.status, fmt.Errorf("abort university directory loader: %w", err)
	}
	return directoryRunner.status, nil
}
