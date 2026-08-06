package utils

import (
	"os"
	"path/filepath"
)

// GetProjectRoot dynamically finds the repository root directory.
func GetProjectRoot() string {
	if root := os.Getenv("BROWSEROS_ROOT"); root != "" {
		return root
	}

	dir, err := os.Getwd()
	if err != nil {
		return "."
	}

	// Climb up to find the root folder containing browseros_academic or Fullcollgeslist
	for {
		if _, err := os.Stat(filepath.Join(dir, "browseros_academic")); err == nil {
			return dir
		}
		if _, err := os.Stat(filepath.Join(dir, "Fullcollgeslist")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	// Fallback to home path or current working directory
	return "."
}
