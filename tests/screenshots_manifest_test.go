package tests

import (
	"encoding/json"
	"image/png"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

type screenshotManifest struct {
	SchemaVersion  int          `json:"schemaVersion"`
	Status         string       `json:"status"`
	ProductVersion string       `json:"productVersion"`
	Platform       string       `json:"platform"`
	Screenshots    []screenshot `json:"screenshots"`
}

type screenshot struct {
	Filename    string `json:"filename"`
	Description string `json:"description"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	CaptureDate string `json:"captureDate"`
}

func TestScreenshotManifestIntegrity(t *testing.T) {
	t.Parallel()

	_, testFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("resolve test file path")
	}
	repositoryRoot := filepath.Dir(filepath.Dir(testFile))
	manifestPath := filepath.Join(repositoryRoot, "docs", "screenshots.json")

	data, err := os.ReadFile(manifestPath)
	if err != nil {
		t.Fatalf("read screenshot manifest: %v", err)
	}

	var manifest screenshotManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		t.Fatalf("decode screenshot manifest: %v", err)
	}

	if manifest.SchemaVersion != 1 {
		t.Fatalf("unexpected screenshot schema version: %d", manifest.SchemaVersion)
	}
	if manifest.Status != "captured" {
		t.Fatalf("screenshot manifest status is %q, want captured", manifest.Status)
	}
	if strings.TrimSpace(manifest.ProductVersion) == "" {
		t.Fatal("screenshot manifest must identify the product version")
	}
	if strings.TrimSpace(manifest.Platform) == "" {
		t.Fatal("screenshot manifest must identify the capture platform")
	}
	if len(manifest.Screenshots) == 0 {
		t.Fatal("screenshot manifest must contain at least one screenshot")
	}

	manifestDirectory := filepath.Dir(manifestPath)
	seenFilenames := make(map[string]struct{}, len(manifest.Screenshots))
	for index, entry := range manifest.Screenshots {
		if entry.Filename == "" || filepath.IsAbs(entry.Filename) {
			t.Fatalf("screenshot %d has an invalid filename %q", index, entry.Filename)
		}

		cleanFilename := filepath.Clean(entry.Filename)
		if cleanFilename == ".." || strings.HasPrefix(cleanFilename, ".."+string(filepath.Separator)) {
			t.Fatalf("screenshot %d escapes the docs directory: %q", index, entry.Filename)
		}
		if strings.ToLower(filepath.Ext(cleanFilename)) != ".png" {
			t.Fatalf("screenshot %d is not a PNG: %q", index, entry.Filename)
		}
		if _, exists := seenFilenames[cleanFilename]; exists {
			t.Fatalf("screenshot filename is duplicated: %q", entry.Filename)
		}
		seenFilenames[cleanFilename] = struct{}{}

		if strings.TrimSpace(entry.Description) == "" {
			t.Fatalf("screenshot %d has no description", index)
		}
		if entry.Width <= 0 || entry.Height <= 0 {
			t.Fatalf("screenshot %d has invalid declared dimensions %dx%d", index, entry.Width, entry.Height)
		}
		if _, err := time.Parse("2006-01-02", entry.CaptureDate); err != nil {
			t.Fatalf("screenshot %d has invalid capture date %q: %v", index, entry.CaptureDate, err)
		}

		imagePath := filepath.Join(manifestDirectory, cleanFilename)
		imageFile, err := os.Open(imagePath)
		if err != nil {
			t.Fatalf("open screenshot %q: %v", entry.Filename, err)
		}
		config, decodeErr := png.DecodeConfig(imageFile)
		closeErr := imageFile.Close()
		if decodeErr != nil {
			t.Fatalf("decode screenshot %q: %v", entry.Filename, decodeErr)
		}
		if closeErr != nil {
			t.Fatalf("close screenshot %q: %v", entry.Filename, closeErr)
		}
		if config.Width != entry.Width || config.Height != entry.Height {
			t.Fatalf(
				"screenshot %q dimensions are %dx%d, manifest declares %dx%d",
				entry.Filename,
				config.Width,
				config.Height,
				entry.Width,
				entry.Height,
			)
		}
	}
}
