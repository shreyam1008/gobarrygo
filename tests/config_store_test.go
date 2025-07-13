package tests

import (
	"path/filepath"
	"testing"

	"github.com/shreyam1008/gobarrygo/internal/config"
	"github.com/shreyam1008/gobarrygo/internal/contracts"
)

func TestStoreSaveAndLoadRoundTrip(t *testing.T) {
	t.Parallel()

	store := config.NewStoreAt(filepath.Join(t.TempDir(), "preferences.json"))
	input := contracts.Preferences{
		Aria2Binary:             "/usr/bin/aria2c",
		DownloadDirectory:       t.TempDir(),
		MaxConcurrentDownloads:  6,
		Split:                   12,
		MaxConnectionsPerServer: 8,
		MinSplitSize:            "2M",
		FileAllocation:          "falloc",
		ContinueDownloads:       true,
		AlwaysResume:            false,
		AutoRename:              false,
		UserAgent:               "GoBarryGo/Test",
		NotifyOnCompletion:      true,
		NotifyOnError:           false,
	}

	if err := store.Save(input); err != nil {
		t.Fatalf("save preferences: %v", err)
	}

	got, err := store.Load()
	if err != nil {
		t.Fatalf("load preferences: %v", err)
	}

	if got.DownloadDirectory != input.DownloadDirectory {
		t.Fatalf("download directory mismatch: got %q want %q", got.DownloadDirectory, input.DownloadDirectory)
	}
	if got.MaxConcurrentDownloads != input.MaxConcurrentDownloads {
		t.Fatalf("max concurrent mismatch: got %d want %d", got.MaxConcurrentDownloads, input.MaxConcurrentDownloads)
	}
	if got.FileAllocation != input.FileAllocation {
		t.Fatalf("file allocation mismatch: got %q want %q", got.FileAllocation, input.FileAllocation)
	}
	if got.UserAgent != input.UserAgent {
		t.Fatalf("user agent mismatch: got %q want %q", got.UserAgent, input.UserAgent)
	}
}

func TestSanitizePreferencesFallsBackToDefaults(t *testing.T) {
	t.Parallel()

	got := config.SanitizePreferences(contracts.Preferences{})

	if got.MaxConcurrentDownloads != 4 {
		t.Fatalf("unexpected max concurrent default: %d", got.MaxConcurrentDownloads)
	}
	if got.Split != 8 {
		t.Fatalf("unexpected split default: %d", got.Split)
	}
	if got.FileAllocation != "prealloc" {
		t.Fatalf("unexpected file allocation default: %q", got.FileAllocation)
	}
	if got.DownloadDirectory == "" {
		t.Fatal("default download directory should not be empty")
	}
}
