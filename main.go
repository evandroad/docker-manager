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

	webview "github.com/webview/webview_go"
)

//go:embed web/*
var webFiles embed.FS

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

	sub, _ := fs.Sub(webFiles, "web")
	mux := http.NewServeMux()
	
	mux.Handle("/", http.FileServer(http.FS(sub)))
	mux.HandleFunc("/api/events", handlers.Events)
	mux.HandleFunc("/api/dashboard", handlers.DashboardInfo)
	mux.HandleFunc("/api/containers", handlers.ContainersList)
	mux.HandleFunc("/api/containers/start", handlers.ContainerStart)
	mux.HandleFunc("/api/containers/stop", handlers.ContainerStop)
	mux.HandleFunc("/api/containers/logs", handlers.ContainerLogs)
	mux.HandleFunc("/api/save-file", handlers.SaveFile)
	mux.HandleFunc("/api/containers/restart", handlers.ContainerRestart)
	mux.HandleFunc("/api/containers/remove", handlers.ContainerRemove)
	mux.HandleFunc("/api/containers/rename", handlers.ContainerRename)
	mux.HandleFunc("/api/compose/start", handlers.ComposeStart)
	mux.HandleFunc("/api/compose/stop", handlers.ComposeStop)
	mux.HandleFunc("/api/compose/up", handlers.ComposeUp)
	mux.HandleFunc("/api/compose/down", handlers.ComposeDown)
	mux.HandleFunc("/api/compose/open-file", handlers.ComposeOpenFile)
	mux.HandleFunc("/api/images", handlers.ImagesList)
	mux.HandleFunc("/api/images/remove", handlers.ImageRemove)
	mux.HandleFunc("/api/images/tag", handlers.ImageTag)
	mux.HandleFunc("/api/volumes", handlers.VolumesList)
	mux.HandleFunc("/api/volumes/remove", handlers.VolumeRemove)
	mux.HandleFunc("/api/networks", handlers.NetworksList)
	mux.HandleFunc("/api/networks/remove", handlers.NetworkRemove)
	mux.HandleFunc("/api/hosts", handlers.HostsList)
	mux.HandleFunc("/api/hosts/save", handlers.HostsSave)
	mux.HandleFunc("/api/hosts/connect", handlers.HostConnect)
	mux.HandleFunc("/api/prefs", handlers.PrefsLoad)
	mux.HandleFunc("/api/prefs/save", handlers.PrefsSave)
	mux.HandleFunc("/api/containers/stats", handlers.ContainerStatsStream)

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic(err)
	}

	go http.Serve(listener, mux)

	return "http://" + listener.Addr().String()
}
