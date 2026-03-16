package main

import (
	"context"
	"embed"
	"io/fs"
	"net"
	"net/http"
	"os"

	webview "github.com/webview/webview_go"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

//go:embed web/*
var webFiles embed.FS

type ContainerInfo struct {
	ID     string
	Name   string
	Image  string
	Status string
	State  string
	Project string
	Service string
}

func containers() []ContainerInfo {
	ctx := context.Background()

	var out []ContainerInfo

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return out
	}

	list, err := cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return out
	}

	for _, c := range list {
		out = append(out, ContainerInfo{
			ID:     c.ID[:12],
			Name:   c.Names[0],
			Image:  c.Image,
			Status: c.Status,
			State:  c.State,
			Project: c.Labels["com.docker.compose.project"],
			Service: c.Labels["com.docker.compose.service"],
		})
	}

	return out
}

func startContainer(id string) string {

	ctx := context.Background()

	cli, err := client.NewClientWithOpts(
		client.FromEnv,
		client.WithAPIVersionNegotiation(),
	)

	if err != nil {
		return err.Error()
	}

	err = cli.ContainerStart(ctx, id, container.StartOptions{})
	if err != nil {
		return err.Error()
	}

	return "ok"
}

func stopContainer(id string) string {
	go func() {
		ctx := context.Background()

		cli, err := client.NewClientWithOpts(
			client.FromEnv,
			client.WithAPIVersionNegotiation(),
		)

		if err != nil {
			return
		}

		timeout := 2 // segundos

		cli.ContainerStop(ctx, id, container.StopOptions{
			Timeout: &timeout,
		})
	}()

	return "ok"
}

func main() {
	os.Setenv("WEBKIT_DISABLE_COMPOSITING_MODE", "1")
	
	url := startServer()

	w := webview.New(true)
	defer w.Destroy()

	w.SetTitle("Docker Manager")
	w.SetSize(1100, 700, webview.HintNone)

	w.Bind("containers", containers)
	w.Bind("startContainer", startContainer)
	w.Bind("stopContainer", stopContainer)

	w.Navigate(url)
	w.Run()
}

func startServer() string {
	sub, _ := fs.Sub(webFiles, "web")
	handler := http.FileServer(http.FS(sub))
	listener, _ := net.Listen("tcp", "127.0.0.1:0")

	go http.Serve(listener, handler)

	return "http://" + listener.Addr().String()
}