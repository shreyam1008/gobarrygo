package config

import (
	"strings"

	"github.com/shreyam1008/gobarrygo/internal/contracts"
	"github.com/shreyam1008/gobarrygo/internal/system"
)

var validFileAllocations = map[string]struct{}{
	"none":     {},
	"prealloc": {},
	"trunc":    {},
	"falloc":   {},
}

func DefaultPreferences() contracts.Preferences {
	return contracts.Preferences{
		DownloadDirectory:       system.DefaultDownloadDirectory(),
		MaxConcurrentDownloads:  4,
		Split:                   8,
		MaxConnectionsPerServer: 8,
		MinSplitSize:            "1M",
		FileAllocation:          "prealloc",
		ContinueDownloads:       true,
		AlwaysResume:            true,
		AutoRename:              true,
		UserAgent:               "GoBarryGo/0.0.5 (BHOODEVI)",
		NotifyOnCompletion:      true,
		NotifyOnError:           true,
	}
}

func SanitizePreferences(input contracts.Preferences) contracts.Preferences {
	output := DefaultPreferences()

	if strings.TrimSpace(input.Aria2Binary) != "" {
		output.Aria2Binary = strings.TrimSpace(input.Aria2Binary)
	}
	if strings.TrimSpace(input.DownloadDirectory) != "" {
		output.DownloadDirectory = strings.TrimSpace(input.DownloadDirectory)
	}
	if input.MaxConcurrentDownloads >= 1 && input.MaxConcurrentDownloads <= 64 {
		output.MaxConcurrentDownloads = input.MaxConcurrentDownloads
	}
	if input.Split >= 1 && input.Split <= 64 {
		output.Split = input.Split
	}
	if input.MaxConnectionsPerServer >= 1 && input.MaxConnectionsPerServer <= 16 {
		output.MaxConnectionsPerServer = input.MaxConnectionsPerServer
	}
	if strings.TrimSpace(input.MinSplitSize) != "" {
		output.MinSplitSize = strings.TrimSpace(input.MinSplitSize)
	}
	if _, ok := validFileAllocations[strings.TrimSpace(input.FileAllocation)]; ok {
		output.FileAllocation = strings.TrimSpace(input.FileAllocation)
	}

	output.ContinueDownloads = input.ContinueDownloads
	output.AlwaysResume = input.AlwaysResume
	output.AutoRename = input.AutoRename
	output.NotifyOnCompletion = input.NotifyOnCompletion
	output.NotifyOnError = input.NotifyOnError

	if strings.TrimSpace(input.UserAgent) != "" {
		output.UserAgent = strings.TrimSpace(input.UserAgent)
	}

	return output
}
