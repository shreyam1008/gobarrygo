package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/shreyam1008/gobarrygo/internal/contracts"
	"github.com/shreyam1008/gobarrygo/internal/system"
)

type Store struct {
	mu   sync.RWMutex
	path string
}

func NewStore() *Store {
	path, err := system.PreferencesFilePath()
	if err != nil {
		path = filepath.Join(".", "preferences.json")
	}
	return NewStoreAt(path)
}

func NewStoreAt(path string) *Store {
	return &Store{path: path}
}

func (s *Store) Path() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.path
}

func (s *Store) Load() (contracts.Preferences, error) {
	s.mu.RLock()
	path := s.path
	s.mu.RUnlock()

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			defaults := DefaultPreferences()
			if saveErr := s.Save(defaults); saveErr != nil {
				return defaults, saveErr
			}
			return defaults, nil
		}
		return contracts.Preferences{}, fmt.Errorf("read preferences: %w", err)
	}

	var prefs contracts.Preferences
	if err := json.Unmarshal(data, &prefs); err != nil {
		return contracts.Preferences{}, fmt.Errorf("decode preferences: %w", err)
	}

	return SanitizePreferences(prefs), nil
}

func (s *Store) Save(prefs contracts.Preferences) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	dir := filepath.Dir(s.path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create preferences directory: %w", err)
	}

	prefs = SanitizePreferences(prefs)
	data, err := json.MarshalIndent(prefs, "", "  ")
	if err != nil {
		return fmt.Errorf("encode preferences: %w", err)
	}

	if err := os.WriteFile(s.path, append(data, '\n'), 0o644); err != nil {
		return fmt.Errorf("write preferences: %w", err)
	}

	return nil
}
