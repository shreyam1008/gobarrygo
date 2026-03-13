package system

import (
	"fmt"
	"os"
	"path/filepath"
)

const (
	appConfigDir = "gobarrygo"
)

func DefaultDownloadDirectory() string {
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		return "."
	}

	downloads := filepath.Join(home, "Downloads")
	if info, statErr := os.Stat(downloads); statErr == nil && info.IsDir() {
		return downloads
	}

	return home
}

func configDirectory() (string, error) {
	root, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("resolve config directory: %w", err)
	}
	return filepath.Join(root, appConfigDir), nil
}

func PreferencesFilePath() (string, error) {
	dir, err := configDirectory()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "preferences.json"), nil
}

func SessionFilePath() (string, error) {
	dir, err := configDirectory()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "session.aria2"), nil
}

func EnsureConfigDirectory() (string, error) {
	dir, err := configDirectory()
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", fmt.Errorf("create config directory: %w", err)
	}
	return dir, nil
}
