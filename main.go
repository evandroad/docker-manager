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

	"docker-manager/internal"

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
	sub, _ := fs.Sub(webFiles, "web")
	mux := http.NewServeMux()
	
	mux.Handle("/", http.FileServer(http.FS(sub)))
	mux.HandleFunc("/events", internal.EventsHandler)
	mux.HandleFunc("/api/containers", internal.ContainersHandler)
	mux.HandleFunc("/api/containers/start", internal.StartContainerHandler)
	mux.HandleFunc("/api/containers/stop", internal.StopContainerHandler)
	mux.HandleFunc("/api/containers/remove", internal.RemoveContainerHandler)
	mux.HandleFunc("/api/images", internal.ImagesHandler)
	mux.HandleFunc("/api/images/remove", internal.RemoveImageHandler)
	mux.HandleFunc("/api/volumes", internal.VolumesHandler)
	mux.HandleFunc("/api/networks", internal.NetworksHandler)

	listener, _ := net.Listen("tcp", "127.0.0.1:1234")

	go http.Serve(listener, mux)

	return "http://" + listener.Addr().String()
}
