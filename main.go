package main

import (
	"embed"
	"io/fs"
	"net"
	"net/http"
	"os"

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

	w.Bind("containers", internal.Containers)
	w.Bind("startContainer", internal.StartContainer)
	w.Bind("stopContainer", internal.StopContainer)

	w.Navigate(url)
	w.Run()
}

func startServer() string {
	sub, _ := fs.Sub(webFiles, "web")
	handler := http.FileServer(http.FS(sub))
	listener, _ := net.Listen("tcp", "127.0.0.1:1234")

	go http.Serve(listener, handler)

	return "http://" + listener.Addr().String()
}