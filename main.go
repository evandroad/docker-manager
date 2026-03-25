package main

import (
	"embed"
	"io/fs"
	"net"
	"net/http"
	"os"

	"docker-manager/internal/handlers"
	"docker-manager/internal/router"
	"docker-manager/internal/service"

	webview "github.com/webview/webview_go"
)

//go:embed web/*
var webFiles embed.FS

var Version = "dev"

func main() {
	os.Setenv("WEBKIT_DISABLE_COMPOSITING_MODE", "1")
	
	url := startServer()

	w := webview.New(true)
	defer w.Destroy()

	w.SetTitle("Docker Manager")
	w.SetSize(1100, 700, webview.HintNone)
	w.Dispatch(func() { maximizeWindow(w.Window()) })
	w.Navigate(url)
	w.Run()
}

func startServer() string {
	handlers.SaveDialogFunc = saveFileDialog
	handlers.OpenFileDialogFunc = openFileDialog
	handlers.OpenTarDialogFunc = openTarDialog
	handlers.AppVersion = Version
	service.SaveDialogFunc = saveFileDialog
	service.VolumeSaveDialogFunc = saveFileDialog
	service.VolumeOpenTarDialogFunc = openTarDialog

	sub, _ := fs.Sub(webFiles, "web")
	r := router.New()

	r.Handle("/", http.FileServer(http.FS(sub)))

	r.Group("/api", func(api *router.Router) {
		api.Get("/events", handlers.Events)
		api.Get("/version", handlers.Version)
		api.Get("/dashboard", handlers.DashboardInfo)

		api.Group("/containers", func(g *router.Router) {
			g.Get("", handlers.ContainersList)
			g.Get("/stats", handlers.ContainerStatsStream)
			g.Get("/start/{id}", handlers.ContainerStart)
			g.Get("/stop/{id}", handlers.ContainerStop)
			g.Get("/restart/{id}", handlers.ContainerRestart)
			g.Get("/remove/{id}", handlers.ContainerRemove)
			g.Get("/inspect/{id}", handlers.ContainerInspect)
			g.Get("/rename/{id}", handlers.ContainerRename)
			g.Get("/logs/{id}", handlers.ContainerLogs)
			g.Get("/exec/{id}", handlers.ContainerExec)
		})

		api.Group("/compose", func(g *router.Router) {
			g.Get("/start/{project}", handlers.ComposeStart)
			g.Get("/stop/{project}", handlers.ComposeStop)
			g.Post("/up", handlers.ComposeUp)
			g.Get("/down/{project}", handlers.ComposeDown)
			g.Get("/open-file", handlers.ComposeOpenFile)
		})

		api.Group("/images", func(g *router.Router) {
			g.Get("", handlers.ImagesList)
			g.Get("/inspect/{id}", handlers.ImageInspect)
			g.Get("/export/{id}", handlers.ImageExport)
			g.Get("/import", handlers.ImageImport)
			g.Get("/pull", handlers.ImagePull)
			g.Get("/search", handlers.ImageSearch)
			g.Get("/search/tags", handlers.ImageSearchTags)
			g.Get("/remove/{id}", handlers.ImageRemove)
			g.Get("/tag/{id}/{tag}/{keep}", handlers.ImageTag)
		})

		api.Group("/volumes", func(g *router.Router) {
			g.Get("", handlers.VolumesList)
			g.Get("/task", handlers.VolumeTaskStatus)
			g.Get("/task/resume", handlers.VolumeTaskResume)
			g.Get("/task/cancel", handlers.VolumeTaskCancel)
			g.Get("/create/{name}", handlers.VolumeCreate)
			g.Get("/copy/{source}/{dest}/{overwrite}", handlers.VolumeCopy)
			g.Get("/export/{name}", handlers.VolumeExport)
			g.Get("/import/{name}", handlers.VolumeImport)
			g.Get("/remove/{name}", handlers.VolumeRemove)
		})

		api.Group("/networks", func(g *router.Router) {
			g.Get("", handlers.NetworksList)
			g.Get("/create/{name}/{driver}", handlers.NetworkCreate)
			g.Get("/remove/{id}", handlers.NetworkRemove)
		})

		api.Group("/hosts", func(g *router.Router) {
			g.Get("", handlers.HostsList)
			g.Post("/save", handlers.HostsSave)
			g.Get("/connect", handlers.HostConnect)
		})

		api.Group("/prefs", func(g *router.Router) {
			g.Get("", handlers.PrefsLoad)
			g.Post("/save", handlers.PrefsSave)
		})

		api.Post("/save-file", handlers.SaveFile)
	})

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}

	go http.Serve(listener, r.Mux)

	return "http://" + listener.Addr().String()
}
