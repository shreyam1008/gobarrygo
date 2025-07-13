package aria2

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

type Client struct {
	endpoint   string
	secret     string
	httpClient *http.Client
}

type rpcRequest struct {
	JSONRPC string `json:"jsonrpc"`
	ID      string `json:"id"`
	Method  string `json:"method"`
	Params  []any  `json:"params,omitempty"`
}

type rpcResponse struct {
	ID     string          `json:"id"`
	Result json.RawMessage `json:"result"`
	Error  *rpcError       `json:"error,omitempty"`
}

type rpcError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type status struct {
	GID             string       `json:"gid"`
	Status          string       `json:"status"`
	TotalLength     string       `json:"totalLength"`
	CompletedLength string       `json:"completedLength"`
	DownloadSpeed   string       `json:"downloadSpeed"`
	UploadSpeed     string       `json:"uploadSpeed"`
	Connections     string       `json:"connections"`
	Dir             string       `json:"dir"`
	ErrorCode       string       `json:"errorCode"`
	ErrorMessage    string       `json:"errorMessage"`
	Files           []statusFile `json:"files"`
}

type statusFile struct {
	Index           string      `json:"index"`
	Path            string      `json:"path"`
	Length          string      `json:"length"`
	CompletedLength string      `json:"completedLength"`
	Selected        string      `json:"selected"`
	URIs            []statusURI `json:"uris"`
}

type statusURI struct {
	URI    string `json:"uri"`
	Status string `json:"status"`
}

type globalStat struct {
	DownloadSpeed string `json:"downloadSpeed"`
	UploadSpeed   string `json:"uploadSpeed"`
	NumActive     string `json:"numActive"`
	NumWaiting    string `json:"numWaiting"`
	NumStopped    string `json:"numStopped"`
}

func NewClient(endpoint, secret string) *Client {
	return &Client{
		endpoint: endpoint,
		secret:   secret,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Client) AddURI(ctx context.Context, uris []string, options map[string]any) (string, error) {
	raw, err := c.call(ctx, "aria2.addUri", uris, options)
	if err != nil {
		return "", err
	}
	var gid string
	if err := json.Unmarshal(raw, &gid); err != nil {
		return "", fmt.Errorf("decode addUri response: %w", err)
	}
	return gid, nil
}

func (c *Client) TellActive(ctx context.Context) ([]status, error) {
	return c.tellMany(ctx, "aria2.tellActive")
}

func (c *Client) TellWaiting(ctx context.Context, offset, limit int) ([]status, error) {
	return c.tellMany(ctx, "aria2.tellWaiting", offset, limit)
}

func (c *Client) TellStopped(ctx context.Context, offset, limit int) ([]status, error) {
	return c.tellMany(ctx, "aria2.tellStopped", offset, limit)
}

func (c *Client) TellStatus(ctx context.Context, gid string) (status, error) {
	raw, err := c.call(ctx, "aria2.tellStatus", gid)
	if err != nil {
		return status{}, err
	}
	var result status
	if err := json.Unmarshal(raw, &result); err != nil {
		return status{}, fmt.Errorf("decode tellStatus response: %w", err)
	}
	return result, nil
}

func (c *Client) Pause(ctx context.Context, gid string) error {
	_, err := c.call(ctx, "aria2.pause", gid)
	return err
}

func (c *Client) Unpause(ctx context.Context, gid string) error {
	_, err := c.call(ctx, "aria2.unpause", gid)
	return err
}

func (c *Client) Remove(ctx context.Context, gid string) error {
	_, err := c.call(ctx, "aria2.remove", gid)
	return err
}

func (c *Client) RemoveDownloadResult(ctx context.Context, gid string) error {
	_, err := c.call(ctx, "aria2.removeDownloadResult", gid)
	return err
}

func (c *Client) PauseAll(ctx context.Context) error {
	_, err := c.call(ctx, "aria2.pauseAll")
	return err
}

func (c *Client) UnpauseAll(ctx context.Context) error {
	_, err := c.call(ctx, "aria2.unpauseAll")
	return err
}

func (c *Client) ChangeGlobalOption(ctx context.Context, options map[string]string) error {
	_, err := c.call(ctx, "aria2.changeGlobalOption", options)
	return err
}

func (c *Client) GetGlobalStat(ctx context.Context) (globalStat, error) {
	raw, err := c.call(ctx, "aria2.getGlobalStat")
	if err != nil {
		return globalStat{}, err
	}
	var result globalStat
	if err := json.Unmarshal(raw, &result); err != nil {
		return globalStat{}, fmt.Errorf("decode global stat response: %w", err)
	}
	return result, nil
}

func (c *Client) GetVersion(ctx context.Context) (string, error) {
	raw, err := c.call(ctx, "aria2.getVersion")
	if err != nil {
		return "", err
	}
	var result struct {
		Version string `json:"version"`
	}
	if err := json.Unmarshal(raw, &result); err != nil {
		return "", fmt.Errorf("decode version response: %w", err)
	}
	return result.Version, nil
}

func (c *Client) tellMany(ctx context.Context, method string, params ...any) ([]status, error) {
	raw, err := c.call(ctx, method, params...)
	if err != nil {
		return nil, err
	}
	var result []status
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, fmt.Errorf("decode %s response: %w", method, err)
	}
	return result, nil
}

func (c *Client) call(ctx context.Context, method string, params ...any) (json.RawMessage, error) {
	payload := rpcRequest{
		JSONRPC: "2.0",
		ID:      strconv.FormatInt(time.Now().UnixNano(), 10),
		Method:  method,
		Params:  params,
	}
	if c.secret != "" {
		payload.Params = append([]any{"token:" + c.secret}, payload.Params...)
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("encode rpc request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create rpc request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("perform rpc request: %w", err)
	}
	defer resp.Body.Close()

	var decoded rpcResponse
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return nil, fmt.Errorf("decode rpc response: %w", err)
	}
	if decoded.Error != nil {
		return nil, fmt.Errorf("aria2 rpc error (%d): %s", decoded.Error.Code, decoded.Error.Message)
	}

	return decoded.Result, nil
}
