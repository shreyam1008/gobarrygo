package tests

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/shreyam1008/gobarrygo/internal/app"
	"github.com/shreyam1008/gobarrygo/internal/config"
	"github.com/shreyam1008/gobarrygo/internal/contracts"
	"github.com/shreyam1008/gobarrygo/internal/version"
)

type fakeManager struct {
	bootstrapCalls int
	restartCalls   int
	snapshotCalls  int
	lastAdd        contracts.AddDownloadRequest
	lastPrefs      contracts.Preferences

	health    contracts.Health
	metrics   contracts.Metrics
	downloads []contracts.DownloadItem
}

func (f *fakeManager) Bootstrap(_ context.Context, prefs contracts.Preferences) (contracts.Health, error) {
	f.bootstrapCalls++
	f.lastPrefs = prefs
	return f.health, nil
}

func (f *fakeManager) Restart(_ context.Context, prefs contracts.Preferences) (contracts.Health, error) {
	f.restartCalls++
	f.lastPrefs = prefs
	return f.health, nil
}

func (f *fakeManager) Snapshot(_ context.Context, prefs contracts.Preferences) ([]contracts.DownloadItem, contracts.Metrics, contracts.Health, error) {
	f.snapshotCalls++
	f.lastPrefs = prefs
	return f.downloads, f.metrics, f.health, nil
}

func (f *fakeManager) AddDownload(_ context.Context, prefs contracts.Preferences, input contracts.AddDownloadRequest) error {
	f.lastPrefs = prefs
	f.lastAdd = input
	return nil
}

func (f *fakeManager) Pause(context.Context, contracts.Preferences, string) error        { return nil }
func (f *fakeManager) Resume(context.Context, contracts.Preferences, string) error       { return nil }
func (f *fakeManager) Retry(context.Context, contracts.Preferences, string) error        { return nil }
func (f *fakeManager) Remove(context.Context, contracts.Preferences, string, bool) error { return nil }
func (f *fakeManager) PauseAll(context.Context, contracts.Preferences) error             { return nil }
func (f *fakeManager) ResumeAll(context.Context, contracts.Preferences) error            { return nil }
func (f *fakeManager) Shutdown() error                                                   { return nil }

func TestControllerBootstrapAndAddDownload(t *testing.T) {
	t.Parallel()

	store := config.NewStoreAt(filepath.Join(t.TempDir(), "preferences.json"))
	manager := &fakeManager{
		health: contracts.Health{Ready: true, Status: "running", Message: "ok", RPCPort: 6800},
		metrics: contracts.Metrics{
			ActiveCount: 1,
			TotalCount:  1,
		},
		downloads: []contracts.DownloadItem{
			{GID: "gid-1", Name: "ubuntu.iso", Status: "active"},
		},
	}
	controller := app.NewController(store, manager)

	snapshot, err := controller.Bootstrap(context.Background())
	if err != nil {
		t.Fatalf("bootstrap: %v", err)
	}

	if snapshot.Version.Number != version.Number {
		t.Fatalf("version mismatch: got %q want %q", snapshot.Version.Number, version.Number)
	}
	if manager.bootstrapCalls == 0 || manager.snapshotCalls == 0 {
		t.Fatalf("expected bootstrap and snapshot calls, got bootstrap=%d snapshot=%d", manager.bootstrapCalls, manager.snapshotCalls)
	}

	updated, err := controller.AddDownload(context.Background(), contracts.AddDownloadRequest{
		URLs: []string{"https://example.com/archive.tar.zst"},
	})
	if err != nil {
		t.Fatalf("add download: %v", err)
	}

	if len(manager.lastAdd.URLs) != 1 || manager.lastAdd.URLs[0] != "https://example.com/archive.tar.zst" {
		t.Fatalf("unexpected add request: %#v", manager.lastAdd)
	}
	if len(updated.Downloads) != 1 {
		t.Fatalf("expected snapshot downloads to remain available")
	}
}

func TestControllerSavePreferencesRestartsManager(t *testing.T) {
	t.Parallel()

	store := config.NewStoreAt(filepath.Join(t.TempDir(), "preferences.json"))
	manager := &fakeManager{
		health: contracts.Health{Ready: true, Status: "running", Message: "ok"},
	}
	controller := app.NewController(store, manager)

	_, err := controller.SavePreferences(context.Background(), contracts.Preferences{
		DownloadDirectory:       t.TempDir(),
		MaxConcurrentDownloads:  10,
		Split:                   10,
		MaxConnectionsPerServer: 10,
		MinSplitSize:            "4M",
		FileAllocation:          "trunc",
		UserAgent:               "GoBarryGo/Test",
	})
	if err != nil {
		t.Fatalf("save preferences: %v", err)
	}

	if manager.restartCalls != 1 {
		t.Fatalf("expected restart call, got %d", manager.restartCalls)
	}

	got, err := store.Load()
	if err != nil {
		t.Fatalf("reload preferences: %v", err)
	}
	if got.MaxConcurrentDownloads != 10 {
		t.Fatalf("max concurrent mismatch: got %d", got.MaxConcurrentDownloads)
	}
	if got.FileAllocation != "trunc" {
		t.Fatalf("file allocation mismatch: got %q", got.FileAllocation)
	}
}
