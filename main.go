package main

/*
#cgo linux pkg-config: gtk+-3.0
#include <gtk/gtk.h>
*/
import "C"

import (
	"embed"
	"io/fs"
	"net"
	"net/http"
	"os"
	"unsafe"

	"docker-manager/internal/handlers"
	"docker-manager/internal/router"

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

	w.Dispatch(func() {
		C.gtk_window_maximize((*C.GtkWindow)(unsafe.Pointer(w.Window())))
	})

	w.Navigate(url)
	w.Run()
}

func startServer() string {
	handlers.SaveDialogFunc = saveFileDialog
	handlers.OpenFileDialogFunc = openFileDialog
	handlers.AppVersion = Version

	sub, _ := fs.Sub(webFiles, "web")
	r := router.New()

	r.Handle("/", http.FileServer(http.FS(sub)))

	r.Get("/api/events", handlers.Events)
	r.Get("/api/version", handlers.Version)
	r.Get("/api/dashboard", handlers.DashboardInfo)

	r.Get("/api/containers", handlers.ContainersList)
	r.Get("/api/containers/stats", handlers.ContainerStatsStream)
	r.Get("/api/containers/start/{id}", handlers.ContainerStart)
	r.Get("/api/containers/stop/{id}", handlers.ContainerStop)
	r.Get("/api/containers/restart/{id}", handlers.ContainerRestart)
	r.Get("/api/containers/remove/{id}", handlers.ContainerRemove)
	r.Get("/api/containers/inspect/{id}", handlers.ContainerInspect)
	r.Get("/api/containers/rename/{id}", handlers.ContainerRename)
	r.Get("/api/containers/logs/{id}", handlers.ContainerLogs)

	r.Get("/api/compose/start/{project}", handlers.ComposeStart)
	r.Get("/api/compose/stop/{project}", handlers.ComposeStop)
	r.Post("/api/compose/up", handlers.ComposeUp)
	r.Get("/api/compose/down/{project}", handlers.ComposeDown)
	r.Get("/api/compose/open-file", handlers.ComposeOpenFile)

	r.Get("/api/images", handlers.ImagesList)
	r.Get("/api/images/inspect/{id}", handlers.ImageInspect)
	r.Get("/api/images/pull", handlers.ImagePull)
	r.Get("/api/images/search", handlers.ImageSearch)
	r.Get("/api/images/search/tags", handlers.ImageSearchTags)
	r.Get("/api/images/remove/{id}", handlers.ImageRemove)
	r.Get("/api/images/tag/{id}/{tag}/{keep}", handlers.ImageTag)

	r.Get("/api/volumes", handlers.VolumesList)
	r.Get("/api/volumes/create/{name}", handlers.VolumeCreate)
	r.Get("/api/volumes/copy/{source}/{dest}/{overwrite}", handlers.VolumeCopy)
	r.Get("/api/volumes/remove/{name}", handlers.VolumeRemove)

	r.Get("/api/networks", handlers.NetworksList)
	r.Get("/api/networks/create/{name}/{driver}", handlers.NetworkCreate)
	r.Get("/api/networks/remove/{id}", handlers.NetworkRemove)

	r.Get("/api/hosts", handlers.HostsList)
	r.Post("/api/hosts/save", handlers.HostsSave)
	r.Get("/api/hosts/connect", handlers.HostConnect)

	r.Get("/api/prefs", handlers.PrefsLoad)
	r.Post("/api/prefs/save", handlers.PrefsSave)

	r.Post("/api/save-file", handlers.SaveFile)

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}

	go http.Serve(listener, r.Mux)

	return "http://" + listener.Addr().String()
}
