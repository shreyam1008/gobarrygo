package app

import (
	"context"
	"fmt"
	"slices"
	"sync"

	"github.com/shreyam1008/gobarrygo/internal/config"
	"github.com/shreyam1008/gobarrygo/internal/contracts"
	"github.com/shreyam1008/gobarrygo/internal/system"
	"github.com/shreyam1008/gobarrygo/internal/version"
)

type manager interface {
	Bootstrap(ctx context.Context, prefs contracts.Preferences) (contracts.Health, error)
	Restart(ctx context.Context, prefs contracts.Preferences) (contracts.Health, error)
	Snapshot(ctx context.Context, prefs contracts.Preferences) ([]contracts.DownloadItem, contracts.Metrics, contracts.Health, error)
	AddDownload(ctx context.Context, prefs contracts.Preferences, input contracts.AddDownloadRequest) error
	Pause(ctx context.Context, prefs contracts.Preferences, gid string) error
	Resume(ctx context.Context, prefs contracts.Preferences, gid string) error
	Retry(ctx context.Context, prefs contracts.Preferences, gid string) error
	Remove(ctx context.Context, prefs contracts.Preferences, gid string, deleteFiles bool) error
	PauseAll(ctx context.Context, prefs contracts.Preferences) error
	ResumeAll(ctx context.Context, prefs contracts.Preferences) error
	Shutdown() error
}

type Store interface {
	Load() (contracts.Preferences, error)
	Save(prefs contracts.Preferences) error
	Path() string
}

type Controller struct {
	mu      sync.RWMutex
	store   Store
	manager manager
	prefs   contracts.Preferences
}

func NewController(store Store, manager manager) *Controller {
	return &Controller{
		store:   store,
		manager: manager,
		prefs:   config.DefaultPreferences(),
	}
}

func (c *Controller) Bootstrap(ctx context.Context) (contracts.AppSnapshot, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if err := c.loadPreferencesLocked(); err != nil {
		return contracts.AppSnapshot{}, err
	}
	return c.snapshotLocked(ctx, false)
}

func (c *Controller) Refresh(ctx context.Context) (contracts.AppSnapshot, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.snapshotLocked(ctx, false)
}

func (c *Controller) SavePreferences(ctx context.Context, prefs contracts.Preferences) (contracts.AppSnapshot, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	prefs = config.SanitizePreferences(prefs)
	if err := c.store.Save(prefs); err != nil {
		return contracts.AppSnapshot{}, err
	}
	c.prefs = prefs
	return c.snapshotLocked(ctx, true)
}

func (c *Controller) Preferences() contracts.Preferences {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.prefs
}

func (c *Controller) AddDownload(ctx context.Context, input contracts.AddDownloadRequest) (contracts.AppSnapshot, error) {
	if len(input.URLs) == 0 {
		return contracts.AppSnapshot{}, fmt.Errorf("at least one url is required")
	}
	return c.mutate(ctx, func(prefs contracts.Preferences) error {
		return c.manager.AddDownload(ctx, prefs, input)
	})
}

func (c *Controller) PauseDownload(ctx context.Context, gid string) (contracts.AppSnapshot, error) {
	return c.mutate(ctx, func(prefs contracts.Preferences) error {
		return c.manager.Pause(ctx, prefs, gid)
	})
}

func (c *Controller) ResumeDownload(ctx context.Context, gid string) (contracts.AppSnapshot, error) {
	return c.mutate(ctx, func(prefs contracts.Preferences) error {
		return c.manager.Resume(ctx, prefs, gid)
	})
}

func (c *Controller) RetryDownload(ctx context.Context, gid string) (contracts.AppSnapshot, error) {
	return c.mutate(ctx, func(prefs contracts.Preferences) error {
		return c.manager.Retry(ctx, prefs, gid)
	})
}

func (c *Controller) RemoveDownload(ctx context.Context, input contracts.RemoveDownloadRequest) (contracts.AppSnapshot, error) {
	return c.mutate(ctx, func(prefs contracts.Preferences) error {
		return c.manager.Remove(ctx, prefs, input.GID, input.DeleteFiles)
	})
}

func (c *Controller) PauseAll(ctx context.Context) (contracts.AppSnapshot, error) {
	return c.mutate(ctx, func(prefs contracts.Preferences) error {
		return c.manager.PauseAll(ctx, prefs)
	})
}

func (c *Controller) ResumeAll(ctx context.Context) (contracts.AppSnapshot, error) {
	return c.mutate(ctx, func(prefs contracts.Preferences) error {
		return c.manager.ResumeAll(ctx, prefs)
	})
}

func (c *Controller) DownloadByGID(gid string) (contracts.DownloadItem, bool, error) {
	snapshot, err := c.Refresh(context.Background())
	if err != nil {
		return contracts.DownloadItem{}, false, err
	}
	index := slices.IndexFunc(snapshot.Downloads, func(item contracts.DownloadItem) bool {
		return item.GID == gid
	})
	if index < 0 {
		return contracts.DownloadItem{}, false, nil
	}
	return snapshot.Downloads[index], true, nil
}

func (c *Controller) ConfigFilePath() string {
	return c.store.Path()
}

func (c *Controller) Shutdown() error {
	return c.manager.Shutdown()
}

func (c *Controller) mutate(ctx context.Context, fn func(prefs contracts.Preferences) error) (contracts.AppSnapshot, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if err := c.loadPreferencesLocked(); err != nil {
		return contracts.AppSnapshot{}, err
	}
	if err := fn(c.prefs); err != nil {
		return contracts.AppSnapshot{}, err
	}
	return c.snapshotLocked(ctx, false)
}

func (c *Controller) loadPreferencesLocked() error {
	prefs, err := c.store.Load()
	if err != nil {
		return err
	}
	c.prefs = config.SanitizePreferences(prefs)
	return nil
}

func (c *Controller) snapshotLocked(ctx context.Context, restart bool) (contracts.AppSnapshot, error) {
	prefs := config.SanitizePreferences(c.prefs)

	var health contracts.Health
	var err error
	if restart {
		health, err = c.manager.Restart(ctx, prefs)
	} else {
		health, err = c.manager.Bootstrap(ctx, prefs)
	}
	if err != nil {
		return contracts.AppSnapshot{}, err
	}

	downloads, metrics, health, err := c.manager.Snapshot(ctx, prefs)
	if err != nil {
		return contracts.AppSnapshot{}, err
	}

	if prefs.DownloadDirectory == "" {
		prefs.DownloadDirectory = system.DefaultDownloadDirectory()
	}

	return contracts.AppSnapshot{
		Version: contracts.VersionInfo{
			Number:   version.Number,
			Codename: version.Codename,
		},
		Health:      health,
		Metrics:     metrics,
		Preferences: prefs,
		Downloads:   downloads,
	}, nil
}
