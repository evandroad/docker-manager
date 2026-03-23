package handlers

import (
	"docker-manager/internal/respond"
	"docker-manager/internal/service"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

func ContainersList(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, service.Containers())
}

func ContainerStart(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	respond.Result(w, service.StartContainer(id))
}

func ContainerStop(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	service.StopContainer(id)
	respond.Result(w, nil)
}

func ContainerRestart(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	service.RestartContainer(id)
	respond.Result(w, nil)
}

func ContainerRemove(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	respond.Result(w, service.RemoveContainer(id))
}

func ContainerRename(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	name := r.URL.Query().Get("name")
	respond.Result(w, service.RenameContainer(id, name))
}

func ContainerLogs(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
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

	buf := make([]byte, 8192)
	for {
		n, err := reader.Read(buf)
		if n > 0 {
			data := buf[:n]
			for len(data) > 0 {
				if len(data) >= 8 {
					size := int(data[4])<<24 | int(data[5])<<16 | int(data[6])<<8 | int(data[7])
					data = data[8:]
					end := size
					if end > len(data) {
						end = len(data)
					}
					line := data[:end]
					data = data[end:]
					encoded, _ := json.Marshal(string(line))
					fmt.Fprintf(w, "data: %s\n\n", encoded)
					flusher.Flush()
				} else {
					break
				}
			}
		}
		if err != nil {
			return
		}
	}
}
