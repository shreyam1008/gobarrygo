package api

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/shreyam1008/gobarrygo/internal/app"
	"github.com/shreyam1008/gobarrygo/internal/contracts"
	"github.com/shreyam1008/gobarrygo/internal/system"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/services/notifications"
)

type Service struct {
	controller *app.Controller
	app        *application.App
	notifier   *notifications.NotificationService

	ctx        context.Context
	mu         sync.Mutex
	pollCancel context.CancelFunc
	last       contracts.AppSnapshot
}

func NewService(controller *app.Controller, notifier *notifications.NotificationService) *Service {
	return &Service{
		controller: controller,
		notifier:   notifier,
	}
}

func (s *Service) ServiceName() string {
	return "github.com/shreyam1008/gobarrygo/internal/api.Service"
}

func (s *Service) ServiceStartup(ctx context.Context, _ application.ServiceOptions) error {
	s.ctx = ctx
	return nil
}

func (s *Service) ServiceShutdown() error {
	s.stopPoller()
	return s.controller.Shutdown()
}

func (s *Service) AttachApp(app *application.App) {
	s.app = app
}

func (s *Service) Bootstrap() (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.Bootstrap(s.callContext())
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.startPoller()
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) Refresh() (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.Refresh(s.callContext())
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) SavePreferences(prefs contracts.Preferences) (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.SavePreferences(s.callContext(), prefs)
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) AddDownload(input contracts.AddDownloadRequest) (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.AddDownload(s.callContext(), input)
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) PauseDownload(gid string) (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.PauseDownload(s.callContext(), gid)
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) ResumeDownload(gid string) (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.ResumeDownload(s.callContext(), gid)
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) RetryDownload(gid string) (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.RetryDownload(s.callContext(), gid)
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) RemoveDownload(input contracts.RemoveDownloadRequest) (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.RemoveDownload(s.callContext(), input)
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) PauseAll() (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.PauseAll(s.callContext())
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) ResumeAll() (contracts.AppSnapshot, error) {
	snapshot, err := s.controller.ResumeAll(s.callContext())
	if err != nil {
		return contracts.AppSnapshot{}, err
	}
	s.publishSnapshot(snapshot)
	return snapshot, nil
}

func (s *Service) OpenDownloadedFile(gid string) error {
	item, ok, err := s.controller.DownloadByGID(gid)
	if err != nil {
		return err
	}
	if !ok || len(item.Files) == 0 {
		return fmt.Errorf("download not found")
	}
	return system.OpenPath(item.Files[0].Path)
}

func (s *Service) OpenDownloadFolder(gid string) error {
	item, ok, err := s.controller.DownloadByGID(gid)
	if err != nil {
		return err
	}
	if !ok || len(item.Files) == 0 {
		return fmt.Errorf("download not found")
	}
	return system.OpenContainingDirectory(item.Files[0].Path)
}

func (s *Service) OpenDownloadDirectory() error {
	return system.OpenPath(s.controller.Preferences().DownloadDirectory)
}

func (s *Service) PickDownloadDirectory() (string, error) {
	if s.app == nil {
		return "", fmt.Errorf("application not ready")
	}
	return s.app.Dialog.
		OpenFile().
		CanChooseDirectories(true).
		CanChooseFiles(false).
		SetTitle("Choose a download folder").
		PromptForSingleSelection()
}

func (s *Service) PickAria2Binary() (string, error) {
	if s.app == nil {
		return "", fmt.Errorf("application not ready")
	}
	return s.app.Dialog.
		OpenFile().
		CanChooseFiles(true).
		CanChooseDirectories(false).
		SetTitle("Choose the aria2c executable").
		PromptForSingleSelection()
}

func (s *Service) RevealPreferencesFile() error {
	return system.OpenContainingDirectory(s.controller.ConfigFilePath())
}

func (s *Service) OpenWebsite(url string) error {
	return system.OpenURL(url)
}

func (s *Service) startPoller() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.pollCancel != nil {
		return
	}

	ctx, cancel := context.WithCancel(s.callContext())
	s.pollCancel = cancel

	go func() {
		ticker := time.NewTicker(1200 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				snapshot, err := s.controller.Refresh(ctx)
				if err == nil {
					s.publishSnapshot(snapshot)
				}
			}
		}
	}()
}

func (s *Service) stopPoller() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.pollCancel != nil {
		s.pollCancel()
		s.pollCancel = nil
	}
}

func (s *Service) publishSnapshot(snapshot contracts.AppSnapshot) {
	s.mu.Lock()
	previous := s.last
	s.last = snapshot
	s.mu.Unlock()

	s.emitNotifications(previous, snapshot)
	if s.app != nil {
		_ = s.app.Event.Emit(contracts.EventSnapshot, snapshot)
	}
}

func (s *Service) emitNotifications(previous, next contracts.AppSnapshot) {
	prevByID := make(map[string]string, len(previous.Downloads))
	for _, item := range previous.Downloads {
		prevByID[item.GID] = item.Status
	}

	for _, item := range next.Downloads {
		prevStatus := prevByID[item.GID]
		if item.Status == prevStatus {
			continue
		}

		switch item.Status {
		case "complete":
			if next.Preferences.NotifyOnCompletion {
				s.notify(contracts.Notification{
					Kind:    "success",
					Title:   "Download complete",
					Message: item.Name,
				})
			}
		case "error":
			if next.Preferences.NotifyOnError {
				message := item.Name
				if item.ErrorMessage != "" {
					message = item.ErrorMessage
				}
				s.notify(contracts.Notification{
					Kind:    "error",
					Title:   "Download failed",
					Message: message,
				})
			}
		}
	}
}

func (s *Service) notify(notification contracts.Notification) {
	if s.app != nil {
		_ = s.app.Event.Emit(contracts.EventNotification, notification)
	}
	if s.notifier != nil {
		_ = s.notifier.SendNotification(notifications.NotificationOptions{
			ID:    fmt.Sprintf("%d", time.Now().UnixNano()),
			Title: notification.Title,
			Body:  notification.Message,
		})
	}
}

func (s *Service) callContext() context.Context {
	if s.ctx != nil {
		return s.ctx
	}
	return context.Background()
}
