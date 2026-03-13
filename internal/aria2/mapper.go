package aria2

import (
	"path/filepath"
	"strconv"

	"github.com/shreyam1008/gobarrygo/internal/contracts"
)

func mapStatus(input status) contracts.DownloadItem {
	files := make([]contracts.DownloadFile, 0, len(input.Files))
	for _, file := range input.Files {
		uris := make([]string, 0, len(file.URIs))
		for _, uri := range file.URIs {
			uris = append(uris, uri.URI)
		}
		files = append(files, contracts.DownloadFile{
			Index:           parseInt(file.Index),
			Path:            file.Path,
			Length:          parseInt64(file.Length),
			CompletedLength: parseInt64(file.CompletedLength),
			Selected:        file.Selected == "true",
			URIs:            uris,
		})
	}

	name := input.GID
	if len(files) > 0 {
		base := filepath.Base(files[0].Path)
		if base != "." && base != string(filepath.Separator) {
			name = base
		}
	}

	totalLength := parseInt64(input.TotalLength)
	completedLength := parseInt64(input.CompletedLength)
	progress := 0.0
	if totalLength > 0 {
		progress = (float64(completedLength) / float64(totalLength)) * 100
	}

	var etaSeconds int64
	downloadSpeed := parseInt64(input.DownloadSpeed)
	if downloadSpeed > 0 && totalLength > completedLength {
		etaSeconds = (totalLength - completedLength) / downloadSpeed
	}

	return contracts.DownloadItem{
		GID:             input.GID,
		Name:            name,
		Status:          input.Status,
		Directory:       input.Dir,
		TotalLength:     totalLength,
		CompletedLength: completedLength,
		Progress:        progress,
		DownloadSpeed:   downloadSpeed,
		UploadSpeed:     parseInt64(input.UploadSpeed),
		Connections:     parseInt(input.Connections),
		ETASeconds:      etaSeconds,
		ErrorCode:       input.ErrorCode,
		ErrorMessage:    input.ErrorMessage,
		Files:           files,
	}
}

func parseInt(value string) int {
	parsed, _ := strconv.Atoi(value)
	return parsed
}
