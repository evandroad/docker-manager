package main

import (
	"context"
	"embed"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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
	
	url, srv := startServer()
	go gracefulShutdown(srv)

	w := webview.New(true)
	defer w.Destroy()

	w.SetTitle("Docker Manager")
	w.SetSize(1100, 700, webview.HintNone)
	w.Dispatch(func() { maximizeWindow(w.Window()) })
	w.Navigate(url)
	w.Run()
}

func startServer() (string, *http.Server) {
	handlers.SaveDialogFunc = saveFileDialog
	handlers.OpenFileDialogFunc = openFileDialog
	handlers.OpenTarDialogFunc = openTarDialog
	handlers.AppVersion = Version
	service.SaveDialogFunc = saveFileDialog
	service.VolumeSaveDialogFunc = saveFileDialog
	service.VolumeOpenTarDialogFunc = openTarDialog

	sub, _ := fs.Sub(webFiles, "web")
	r := router.New()
	r.Use(router.RequestID)
	r.Use(router.Recovery)
	r.Use(router.Logger)

	fileServer := http.FileServer(http.FS(sub))
	r.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if p := req.URL.Path; len(p) > 4 {
			switch p[len(p)-3:] {
			case ".js", "css":
				w.Header().Set("Cache-Control", "public, max-age=86400")
			}
		}
		fileServer.ServeHTTP(w, req)
	}))

	r.Group("/api", func(api *router.Router) {
		api.Use(router.JSONErrors)
		api.Get("/events", handlers.Events)
		api.Get("/version", handlers.Version)
		api.Get("/dashboard", handlers.DashboardInfo)

		api.Group("/containers", func(g *router.Router) {
			g.Get("", handlers.ContainersList)
			g.Get("/stats", handlers.ContainerStatsStream)
			g.Post("/start/{id}", handlers.ContainerStart)
			g.Post("/stop/{id}", handlers.ContainerStop)
			g.Post("/restart/{id}", handlers.ContainerRestart)
			g.Del("/remove/{id}", handlers.ContainerRemove)
			g.Get("/inspect/{id}", handlers.ContainerInspect)
			g.Patch("/rename/{id}", handlers.ContainerRename)
			g.Get("/logs/{id}", handlers.ContainerLogs)
			g.Get("/exec/{id}", handlers.ContainerExec)
		})

		api.Group("/compose", func(g *router.Router) {
			g.Post("/start/{project}", handlers.ComposeStart)
			g.Post("/stop/{project}", handlers.ComposeStop)
			g.Post("/up", handlers.ComposeUp)
			g.Post("/down/{project}", handlers.ComposeDown)
			g.Get("/open-file", handlers.ComposeOpenFile)
		})

		api.Group("/images", func(g *router.Router) {
			g.Get("", handlers.ImagesList)
			g.Get("/inspect/{id}", handlers.ImageInspect)
			g.Get("/export/{id}", handlers.ImageExport)
			g.Post("/import", handlers.ImageImport)
			g.Post("/pull", handlers.ImagePull)
			g.Get("/search", handlers.ImageSearch)
			g.Get("/search/tags", handlers.ImageSearchTags)
			g.Del("/remove/{id}", handlers.ImageRemove)
			g.Post("/tag/{id}/{tag}/{keep}", handlers.ImageTag)
		})

		api.Group("/volumes", func(g *router.Router) {
			g.Get("", handlers.VolumesList)
			g.Get("/task", handlers.VolumeTaskStatus)
			g.Post("/task/resume", handlers.VolumeTaskResume)
			g.Post("/task/cancel", handlers.VolumeTaskCancel)
			g.Post("/create/{name}", handlers.VolumeCreate)
			g.Post("/copy/{source}/{dest}/{overwrite}", handlers.VolumeCopy)
			g.Get("/export/{name}", handlers.VolumeExport)
			g.Post("/import/{name}", handlers.VolumeImport)
			g.Del("/remove/{name}", handlers.VolumeRemove)
		})

		api.Group("/networks", func(g *router.Router) {
			g.Get("", handlers.NetworksList)
			g.Post("/create/{name}/{driver}", handlers.NetworkCreate)
			g.Del("/remove/{id}", handlers.NetworkRemove)
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

	srv := &http.Server{
		Handler:           r.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	go srv.Serve(listener)

	return "http://" + listener.Addr().String(), srv
}

func gracefulShutdown(srv *http.Server) {
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}