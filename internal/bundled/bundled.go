package bundled

import (
	"embed"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

//go:embed all:bin
var binFS embed.FS

// Aria2cPath extracts the bundled aria2c binary (if present) to the
// user cache directory and returns its absolute path.
// Returns ("", nil) if no aria2c binary is bundled.
func Aria2cPath() (string, error) {
	name, data, err := findAria2c()
	if err != nil {
		return "", nil // not bundled — caller should fall back
	}

	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return "", fmt.Errorf("bundled: cache dir: %w", err)
	}

	destDir := filepath.Join(cacheDir, "gobarrygo", "bin")
	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return "", fmt.Errorf("bundled: mkdir: %w", err)
	}

	dest := filepath.Join(destDir, name)

	// Skip extraction if already present with matching size.
	if info, statErr := os.Stat(dest); statErr == nil && info.Size() == int64(len(data)) {
		return dest, nil
	}

	if err := os.WriteFile(dest, data, 0o755); err != nil {
		return "", fmt.Errorf("bundled: write aria2c: %w", err)
	}

	return dest, nil
}

func findAria2c() (string, []byte, error) {
	entries, err := fs.ReadDir(binFS, "bin")
	if err != nil {
		return "", nil, err
	}

	wantName := "aria2c"
	if runtime.GOOS == "windows" {
		wantName = "aria2c.exe"
	}

	for _, entry := range entries {
		if entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		if entry.Name() == wantName {
			data, err := fs.ReadFile(binFS, "bin/"+wantName)
			if err != nil {
				return "", nil, err
			}
			if len(data) == 0 {
				return "", nil, fmt.Errorf("bundled: %s is empty", wantName)
			}
			return wantName, data, nil
		}
	}

	return "", nil, fmt.Errorf("bundled: aria2c not found")
}
