package aria2

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/shreyam1008/gobarrygo/internal/bundled"
	"github.com/shreyam1008/gobarrygo/internal/config"
	"github.com/shreyam1008/gobarrygo/internal/contracts"
	"github.com/shreyam1008/gobarrygo/internal/system"
)

type Manager struct {
	mu         sync.Mutex
	cmd        *exec.Cmd
	client     *Client
	rpcPort    int
	rpcSecret  string
	binaryPath string
	cancel     context.CancelFunc
}

func NewManager() *Manager {
	return &Manager{}
}

func (m *Manager) Bootstrap(ctx context.Context, prefs contracts.Preferences) (contracts.Health, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.bootstrapLocked(ctx, config.SanitizePreferences(prefs))
}

func (m *Manager) Restart(ctx context.Context, prefs contracts.Preferences) (contracts.Health, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if err := m.shutdownLocked(); err != nil {
		return contracts.Health{}, err
	}
	return m.bootstrapLocked(ctx, config.SanitizePreferences(prefs))
}

func (m *Manager) Snapshot(ctx context.Context, prefs contracts.Preferences) ([]contracts.DownloadItem, contracts.Metrics, contracts.Health, error) {
	m.mu.Lock()
	health, err := m.bootstrapLocked(ctx, config.SanitizePreferences(prefs))
	client := m.client
	m.mu.Unlock()
	if err != nil {
		return nil, contracts.Metrics{}, health, err
	}
	if !health.Ready {
		return nil, contracts.Metrics{}, health, nil
	}

	active, err := client.TellActive(ctx)
	if err != nil {
		return nil, contracts.Metrics{}, health, err
	}
	waiting, err := client.TellWaiting(ctx, 0, 200)
	if err != nil {
		return nil, contracts.Metrics{}, health, err
	}
	stopped, err := client.TellStopped(ctx, 0, 200)
	if err != nil {
		return nil, contracts.Metrics{}, health, err
	}
	stat, err := client.GetGlobalStat(ctx)
	if err != nil {
		return nil, contracts.Metrics{}, health, err
	}

	items := make([]contracts.DownloadItem, 0, len(active)+len(waiting)+len(stopped))
	for _, entry := range active {
		items = append(items, mapStatus(entry))
	}
	for _, entry := range waiting {
		items = append(items, mapStatus(entry))
	}
	for _, entry := range stopped {
		items = append(items, mapStatus(entry))
	}

	metrics := contracts.Metrics{
		ActiveCount:   len(active),
		WaitingCount:  len(waiting),
		StoppedCount:  len(stopped),
		TotalCount:    len(items),
		DownloadSpeed: parseInt64(stat.DownloadSpeed),
		UploadSpeed:   parseInt64(stat.UploadSpeed),
	}

	return items, metrics, health, nil
}

func (m *Manager) AddDownload(ctx context.Context, prefs contracts.Preferences, input contracts.AddDownloadRequest) error {
	client, _, err := m.readyClient(ctx, prefs)
	if err != nil {
		return err
	}

	options := map[string]any{
		"dir":                       pickDirectory(input.Directory, prefs.DownloadDirectory),
		"max-connection-per-server": fmt.Sprintf("%d", prefs.MaxConnectionsPerServer),
		"split":                     fmt.Sprintf("%d", prefs.Split),
		"min-split-size":            prefs.MinSplitSize,
		"file-allocation":           prefs.FileAllocation,
		"continue":                  boolString(prefs.ContinueDownloads),
		"always-resume":             boolString(prefs.AlwaysResume),
		"auto-file-renaming":        boolString(prefs.AutoRename),
		"user-agent":                pickString(input.UserAgent, prefs.UserAgent),
	}
	if input.OutputName != "" {
		options["out"] = input.OutputName
	}
	if len(input.Headers) > 0 {
		options["header"] = input.Headers
	}

	_, err = client.AddURI(ctx, input.URLs, options)
	return err
}

func (m *Manager) Pause(ctx context.Context, prefs contracts.Preferences, gid string) error {
	client, _, err := m.readyClient(ctx, prefs)
	if err != nil {
		return err
	}
	return client.Pause(ctx, gid)
}

func (m *Manager) Resume(ctx context.Context, prefs contracts.Preferences, gid string) error {
	client, _, err := m.readyClient(ctx, prefs)
	if err != nil {
		return err
	}
	return client.Unpause(ctx, gid)
}

func (m *Manager) Retry(ctx context.Context, prefs contracts.Preferences, gid string) error {
	client, _, err := m.readyClient(ctx, prefs)
	if err != nil {
		return err
	}

	item, err := client.TellStatus(ctx, gid)
	if err != nil {
		return err
	}

	uris := collectURIs(item)
	if len(uris) == 0 {
		return fmt.Errorf("no retryable urls found for %s", gid)
	}

	options := map[string]any{
		"dir":                       pickString(item.Dir, prefs.DownloadDirectory),
		"max-connection-per-server": fmt.Sprintf("%d", prefs.MaxConnectionsPerServer),
		"split":                     fmt.Sprintf("%d", prefs.Split),
		"min-split-size":            prefs.MinSplitSize,
		"file-allocation":           prefs.FileAllocation,
		"continue":                  boolString(prefs.ContinueDownloads),
		"always-resume":             boolString(prefs.AlwaysResume),
		"auto-file-renaming":        boolString(prefs.AutoRename),
		"user-agent":                prefs.UserAgent,
	}

	if len(item.Files) > 0 && item.Files[0].Path != "" {
		options["out"] = filepath.Base(item.Files[0].Path)
	}

	if err := client.RemoveDownloadResult(ctx, gid); err != nil {
		return err
	}

	_, err = client.AddURI(ctx, uris, options)
	return err
}

func (m *Manager) Remove(ctx context.Context, prefs contracts.Preferences, gid string, deleteFiles bool) error {
	client, _, err := m.readyClient(ctx, prefs)
	if err != nil {
		return err
	}

	item, statusErr := client.TellStatus(ctx, gid)
	_ = client.Remove(ctx, gid)
	if err := client.RemoveDownloadResult(ctx, gid); err != nil {
		return err
	}

	if deleteFiles && statusErr == nil {
		for _, file := range item.Files {
			if file.Path == "" {
				continue
			}
			_ = os.Remove(file.Path)
		}
	}

	return nil
}

func (m *Manager) PauseAll(ctx context.Context, prefs contracts.Preferences) error {
	client, _, err := m.readyClient(ctx, prefs)
	if err != nil {
		return err
	}
	return client.PauseAll(ctx)
}

func (m *Manager) ResumeAll(ctx context.Context, prefs contracts.Preferences) error {
	client, _, err := m.readyClient(ctx, prefs)
	if err != nil {
		return err
	}
	return client.UnpauseAll(ctx)
}

func (m *Manager) Shutdown() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.shutdownLocked()
}

func (m *Manager) bootstrapLocked(ctx context.Context, prefs contracts.Preferences) (contracts.Health, error) {
	binaryPath, err := resolveBinary(prefs.Aria2Binary)
	if err != nil {
		return contracts.Health{
			Ready:   false,
			Status:  "binary_missing",
			Message: "aria2c was not found. Set the binary path in preferences.",
		}, nil
	}

	if m.client != nil {
		pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()
		if _, err := m.client.GetVersion(pingCtx); err == nil {
			return contracts.Health{
				Ready:      true,
				Status:     "running",
				Message:    "aria2c is ready.",
				BinaryPath: binaryPath,
				RPCPort:    m.rpcPort,
			}, nil
		}
		_ = m.shutdownLocked()
	}

	if err := os.MkdirAll(prefs.DownloadDirectory, 0o755); err != nil {
		return contracts.Health{}, fmt.Errorf("create download directory: %w", err)
	}
	if _, err := system.EnsureConfigDirectory(); err != nil {
		return contracts.Health{}, err
	}

	port, err := reservePort()
	if err != nil {
		return contracts.Health{}, err
	}
	secret, err := randomToken()
	if err != nil {
		return contracts.Health{}, err
	}
	sessionFile, err := system.SessionFilePath()
	if err != nil {
		return contracts.Health{}, err
	}
	// Ensure session file exists, otherwise aria2c fails with --input-file
	if _, err := os.Stat(sessionFile); os.IsNotExist(err) {
		if err := os.WriteFile(sessionFile, []byte{}, 0o644); err != nil {
			return contracts.Health{}, fmt.Errorf("create session file: %w", err)
		}
	}

	procCtx, cancel := context.WithCancel(context.Background())
	args := []string{
		"--enable-rpc=true",
		"--rpc-listen-all=false",
		fmt.Sprintf("--rpc-listen-port=%d", port),
		fmt.Sprintf("--rpc-secret=%s", secret),
		fmt.Sprintf("--dir=%s", prefs.DownloadDirectory),
		fmt.Sprintf("--max-concurrent-downloads=%d", prefs.MaxConcurrentDownloads),
		fmt.Sprintf("--max-connection-per-server=%d", prefs.MaxConnectionsPerServer),
		fmt.Sprintf("--split=%d", prefs.Split),
		fmt.Sprintf("--min-split-size=%s", prefs.MinSplitSize),
		fmt.Sprintf("--file-allocation=%s", prefs.FileAllocation),
		fmt.Sprintf("--continue=%s", boolString(prefs.ContinueDownloads)),
		fmt.Sprintf("--always-resume=%s", boolString(prefs.AlwaysResume)),
		fmt.Sprintf("--auto-file-renaming=%s", boolString(prefs.AutoRename)),
		fmt.Sprintf("--user-agent=%s", prefs.UserAgent),
		"--summary-interval=0",
		"--download-result=hide",
		fmt.Sprintf("--input-file=%s", sessionFile),
		fmt.Sprintf("--save-session=%s", sessionFile),
		"--save-session-interval=30",
	}

	// Capture stderr for debugging startup failures
	var stderr bytes.Buffer
	cmd := exec.CommandContext(procCtx, binaryPath, args...)
	cmd.Stdout = io.Discard
	cmd.Stderr = &stderr

	if err := cmd.Start(); err != nil {
		cancel()
		return contracts.Health{}, fmt.Errorf("start aria2c: %w", err)
	}

	client := NewClient(fmt.Sprintf("http://127.0.0.1:%d/jsonrpc", port), secret)
	if err := waitForRPC(ctx, client); err != nil {
		cancel()
		_ = cmd.Process.Kill()
		// Include stderr in the error message
		return contracts.Health{}, fmt.Errorf("%w: %s", err, stderr.String())
	}

	m.cmd = cmd
	m.client = client
	m.rpcPort = port
	m.rpcSecret = secret
	m.binaryPath = binaryPath
	m.cancel = cancel

	return contracts.Health{
		Ready:      true,
		Status:     "running",
		Message:    "aria2c is ready.",
		BinaryPath: binaryPath,
		RPCPort:    port,
	}, nil
}

func (m *Manager) shutdownLocked() error {
	if m.cancel != nil {
		m.cancel()
	}
	if m.cmd != nil && m.cmd.Process != nil {
		_ = m.cmd.Process.Kill()
		_, _ = m.cmd.Process.Wait()
	}

	m.cmd = nil
	m.client = nil
	m.rpcPort = 0
	m.rpcSecret = ""
	m.binaryPath = ""
	m.cancel = nil
	return nil
}

func (m *Manager) readyClient(ctx context.Context, prefs contracts.Preferences) (*Client, contracts.Health, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	health, err := m.bootstrapLocked(ctx, config.SanitizePreferences(prefs))
	if err != nil {
		return nil, health, err
	}
	if !health.Ready {
		return nil, health, errors.New(health.Message)
	}
	return m.client, health, nil
}

func resolveBinary(explicit string) (string, error) {
	if explicit != "" {
		path, err := exec.LookPath(explicit)
		if err == nil {
			return path, nil
		}
		if info, statErr := os.Stat(explicit); statErr == nil && !info.IsDir() {
			return explicit, nil
		}
	}

	// Try system PATH first.
	if path, err := exec.LookPath("aria2c"); err == nil {
		return path, nil
	}

	// Fall back to bundled aria2c extracted to user cache.
	if bundledPath, err := bundled.Aria2cPath(); err == nil && bundledPath != "" {
		return bundledPath, nil
	}

	return "", fmt.Errorf("aria2c not found in PATH or bundle")
}

func reservePort() (int, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, fmt.Errorf("reserve rpc port: %w", err)
	}
	defer listener.Close()

	addr, ok := listener.Addr().(*net.TCPAddr)
	if !ok {
		return 0, fmt.Errorf("resolve rpc port")
	}
	return addr.Port, nil
}

func randomToken() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("generate rpc token: %w", err)
	}
	return hex.EncodeToString(buf), nil
}

func waitForRPC(ctx context.Context, client *Client) error {
	deadline := time.NewTimer(10 * time.Second)
	defer deadline.Stop()

	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	for {
		pingCtx, cancel := context.WithTimeout(ctx, 1500*time.Millisecond)
		_, err := client.GetVersion(pingCtx)
		cancel()
		if err == nil {
			return nil
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-deadline.C:
			return fmt.Errorf("aria2c rpc did not become ready")
		case <-ticker.C:
		}
	}
}

func boolString(value bool) string {
	if value {
		return "true"
	}
	return "false"
}

func pickString(primary, fallback string) string {
	if primary != "" {
		return primary
	}
	return fallback
}

func pickDirectory(primary, fallback string) string {
	if primary != "" {
		return primary
	}
	return fallback
}

func collectURIs(input status) []string {
	result := make([]string, 0, len(input.Files))
	for _, file := range input.Files {
		for _, uri := range file.URIs {
			if uri.URI != "" {
				result = append(result, uri.URI)
			}
		}
	}
	return result
}

func parseInt64(value string) int64 {
	parsed, _ := strconv.ParseInt(value, 10, 64)
	return parsed
}
