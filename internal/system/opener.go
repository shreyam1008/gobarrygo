package system

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
)

func OpenPath(path string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer.exe", filepath.Clean(path))
	case "darwin":
		cmd = exec.Command("open", filepath.Clean(path))
	default:
		cmd = exec.Command("xdg-open", filepath.Clean(path))
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("open path: %w", err)
	}
	return nil
}

func OpenContainingDirectory(path string) error {
	cleanPath := filepath.Clean(path)
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer.exe", "/select,", cleanPath)
	case "darwin":
		cmd = exec.Command("open", "-R", cleanPath)
	default:
		cmd = exec.Command("xdg-open", filepath.Dir(cleanPath))
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("open containing directory: %w", err)
	}
	return nil
}

func OpenURL(url string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32.exe", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("open url: %w", err)
	}
	return nil
}
