package collegesvc

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFullCollegeBundleComplete(t *testing.T) {
	dir := t.TempDir()
	required := []string{
		"ug.json", "pg.json", "phd.json", "scholarships.json",
		"placements.json", "studentstats.json", "admissions.json",
		"departments.json", "infrastructure_accommodations.json",
		"online.json", "alumni.json", "portals.json", "about.json",
	}
	for _, name := range required {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(`{"ok":true}`), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	if !fullCollegeBundleComplete(dir) {
		t.Fatal("expected all six InitialThree branches to be complete")
	}
	if err := os.Remove(filepath.Join(dir, "about.json")); err != nil {
		t.Fatal(err)
	}
	if fullCollegeBundleComplete(dir) {
		t.Fatal("about branch must be required")
	}
}

func TestSectionForFullCollegeFile(t *testing.T) {
	tests := map[string]string{
		"ug.json":                            "programs",
		"placements.json":                    "placements",
		"studentstats.json":                  "basic_info",
		"infrastructure_accommodations.json": "infrastructure",
		"about.json":                         "basic_info",
	}
	for filename, want := range tests {
		if got := sectionForFullCollegeFile(filename); got != want {
			t.Fatalf("%s: got %s, want %s", filename, got, want)
		}
	}
}
