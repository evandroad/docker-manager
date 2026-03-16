package main

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os"

	"docker-manager/internal"

	"github.com/docker/docker/api/types/events"
	"github.com/docker/docker/client"
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
	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.FS(sub)))
	mux.HandleFunc("/events", EventsHandler)
	listener, _ := net.Listen("tcp", "127.0.0.1:1234")
	http.HandleFunc("/events", EventsHandler)

	go http.Serve(listener, mux)

	return "http://" + listener.Addr().String()
}

func EventsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	ctx := context.Background()
	cli, _ := client.NewClientWithOpts(client.FromEnv)
	msgs, errs := cli.Events(ctx, events.ListOptions{})

	for {
		select {
		case msg := <-msgs:
			data, _ := json.Marshal(msg)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()

		case err := <-errs:
			fmt.Println("docker events error:", err)
			return
		}
	}
}