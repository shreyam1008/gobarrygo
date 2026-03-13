package main

import (
	"embed"
	"log"

	"github.com/shreyam1008/gobarrygo/internal/api"
	"github.com/shreyam1008/gobarrygo/internal/app"
	"github.com/shreyam1008/gobarrygo/internal/aria2"
	"github.com/shreyam1008/gobarrygo/internal/config"
	"github.com/shreyam1008/gobarrygo/internal/contracts"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/services/notifications"
)

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	application.RegisterEvent[contracts.AppSnapshot](contracts.EventSnapshot)
	application.RegisterEvent[contracts.Notification](contracts.EventNotification)
}

func main() {
	store := config.NewStore()
	manager := aria2.NewManager()
	controller := app.NewController(store, manager)
	notificationService := notifications.New()
	apiService := api.NewService(controller, notificationService)

	desktop := application.New(application.Options{
		Name:        "GoBarryGo",
		Description: "A lightweight aria2c desktop controller.",
		Services: []application.Service{
			application.NewService(apiService),
			application.NewService(notificationService),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	apiService.AttachApp(desktop)

	desktop.Window.NewWithOptions(application.WebviewWindowOptions{
		Name:             "main",
		Title:            "GoBarryGo",
		Width:            1320,
		Height:           860,
		MinWidth:         1080,
		MinHeight:        720,
		EnableFileDrop:   false,
		BackgroundColour: application.NewRGB(13, 17, 22),
		URL:              "/",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 48,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar: application.MacTitleBar{
				Hide:               true,
				HideTitle:          true,
				AppearsTransparent: true,
				FullSizeContent:    true,
			},
		},
	})

	if err := desktop.Run(); err != nil {
		log.Fatal(err)
	}
}
