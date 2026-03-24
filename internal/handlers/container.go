package handlers

import (
	"docker-manager/internal/respond"
	"docker-manager/internal/service"
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

func ContainersList(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, service.Containers())
}

func ContainerStart(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	respond.Result(w, service.StartContainer(id))
}

func ContainerStop(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	service.StopContainer(id)
	respond.Result(w, nil)
}

func ContainerRestart(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	service.RestartContainer(id)
	respond.Result(w, nil)
}

func ContainerRemove(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	respond.Result(w, service.RemoveContainer(id))
}

func ContainerInspect(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	detail, err := service.InspectContainer(id)
	if err != nil {
		respond.JSON(w, http.StatusOK, respond.H{"error": err.Error()})
		return
	}
	respond.JSON(w, http.StatusOK, detail)
}

func ContainerRename(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	name := r.URL.Query().Get("name")
	respond.Result(w, service.RenameContainer(id, name))
}

func ContainerLogs(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	ctx := r.Context()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return
	}

	reader, err := cli.ContainerLogs(ctx, id, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       "200",
		Follow:     true,
	})
	if err != nil {
		return
	}
	defer reader.Close()

	pr, pw := io.Pipe()
	go func() {
		stdcopy.StdCopy(pw, pw, reader)
		pw.Close()
	}()

	scanner := bufio.NewScanner(pr)
	scanner.Buffer(make([]byte, 64*1024), 64*1024)
	for scanner.Scan() {
		encoded, _ := json.Marshal(scanner.Text() + "\n")
		fmt.Fprintf(w, "data: %s\n\n", encoded)
		flusher.Flush()
	}
}
