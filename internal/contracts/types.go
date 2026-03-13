package contracts

const (
	EventSnapshot     = "app:snapshot"
	EventNotification = "app:notification"
)

type AppSnapshot struct {
	Version     VersionInfo    `json:"version"`
	Health      Health         `json:"health"`
	Metrics     Metrics        `json:"metrics"`
	Preferences Preferences    `json:"preferences"`
	Downloads   []DownloadItem `json:"downloads"`
}

type VersionInfo struct {
	Number   string `json:"number"`
	Codename string `json:"codename"`
}

type Health struct {
	Ready      bool   `json:"ready"`
	Status     string `json:"status"`
	Message    string `json:"message"`
	BinaryPath string `json:"binaryPath"`
	RPCPort    int    `json:"rpcPort"`
}

type Metrics struct {
	ActiveCount   int   `json:"activeCount"`
	WaitingCount  int   `json:"waitingCount"`
	StoppedCount  int   `json:"stoppedCount"`
	TotalCount    int   `json:"totalCount"`
	DownloadSpeed int64 `json:"downloadSpeed"`
	UploadSpeed   int64 `json:"uploadSpeed"`
}

type Preferences struct {
	Aria2Binary             string `json:"aria2Binary"`
	DownloadDirectory       string `json:"downloadDirectory"`
	MaxConcurrentDownloads  int    `json:"maxConcurrentDownloads"`
	Split                   int    `json:"split"`
	MaxConnectionsPerServer int    `json:"maxConnectionsPerServer"`
	MinSplitSize            string `json:"minSplitSize"`
	FileAllocation          string `json:"fileAllocation"`
	ContinueDownloads       bool   `json:"continueDownloads"`
	AlwaysResume            bool   `json:"alwaysResume"`
	AutoRename              bool   `json:"autoRename"`
	UserAgent               string `json:"userAgent"`
	NotifyOnCompletion      bool   `json:"notifyOnCompletion"`
	NotifyOnError           bool   `json:"notifyOnError"`
}

type AddDownloadRequest struct {
	URLs       []string `json:"urls"`
	Directory  string   `json:"directory"`
	OutputName string   `json:"outputName"`
	Headers    []string `json:"headers"`
	UserAgent  string   `json:"userAgent"`
}

type RemoveDownloadRequest struct {
	GID         string `json:"gid"`
	DeleteFiles bool   `json:"deleteFiles"`
}

type DownloadItem struct {
	GID             string         `json:"gid"`
	Name            string         `json:"name"`
	Status          string         `json:"status"`
	Directory       string         `json:"directory"`
	TotalLength     int64          `json:"totalLength"`
	CompletedLength int64          `json:"completedLength"`
	Progress        float64        `json:"progress"`
	DownloadSpeed   int64          `json:"downloadSpeed"`
	UploadSpeed     int64          `json:"uploadSpeed"`
	Connections     int            `json:"connections"`
	ETASeconds      int64          `json:"etaSeconds"`
	ErrorCode       string         `json:"errorCode"`
	ErrorMessage    string         `json:"errorMessage"`
	Files           []DownloadFile `json:"files"`
}

type DownloadFile struct {
	Index           int      `json:"index"`
	Path            string   `json:"path"`
	Length          int64    `json:"length"`
	CompletedLength int64    `json:"completedLength"`
	Selected        bool     `json:"selected"`
	URIs            []string `json:"uris"`
}

type Notification struct {
	Kind    string `json:"kind"`
	Title   string `json:"title"`
	Message string `json:"message"`
}
