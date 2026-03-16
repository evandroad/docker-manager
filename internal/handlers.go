package internal

import (
	"context"
	"docker-manager/internal/respond"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/events"
	"github.com/docker/docker/client"
)

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
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		fmt.Println("Error creating docker client:", err)
		return
	}

	msgs, errs := cli.Events(ctx, events.ListOptions{})

	for {
		select {
		case msg := <-msgs:
			if msg.Type == "container" {
				event := map[string]any{
					"Type":   msg.Type,
					"Action": msg.Action,
					"ID":     msg.Actor.ID,
					"Time":   msg.Time,
				}
				data, _ := json.Marshal(event)
				fmt.Fprintf(w, "data: %s\n\n", data)
				flusher.Flush()
			}
		case err := <-errs:
			fmt.Println("docker events error:", err)
			return
		}
	}
}

func ContainersHandler(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, Containers())
}

func ImagesHandler(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, Images())
}

func RemoveImageHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	result := RemoveImage(id)
	respond.JSON(w, http.StatusOK, respond.H{"result": result})
}

func VolumesHandler(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, Volumes())
}

func NetworksHandler(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, Networks())
}

func StartContainerHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	result := StartContainer(id)
	respond.JSON(w, http.StatusOK, respond.H{"result": result})
}

func StopContainerHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	result := StopContainer(id)
	respond.JSON(w, http.StatusOK, respond.H{"result": result})
}

func RestartContainerHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	result := RestartContainer(id)
	respond.JSON(w, http.StatusOK, respond.H{"result": result})
}

func ContainerLogsHandler(w http.ResponseWriter, r *http.Request) {
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
			// Docker multiplexed stream: skip 8-byte header per frame
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

func RemoveContainerHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	result := RemoveContainer(id)
	respond.JSON(w, http.StatusOK, respond.H{"result": result})
}

func ComposeStartHandler(w http.ResponseWriter, r *http.Request) {
	project := r.URL.Query().Get("project")
	result := ComposeStart(project)
	respond.JSON(w, http.StatusOK, respond.H{"result": result})
}

func ComposeStopHandler(w http.ResponseWriter, r *http.Request) {
	project := r.URL.Query().Get("project")
	result := ComposeStop(project)
	respond.JSON(w, http.StatusOK, respond.H{"result": result})
}

func RemoveVolumeHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	result := RemoveVolume(name)
	respond.JSON(w, http.StatusOK, respond.H{"result": result})
}

func RemoveNetworkHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	result := RemoveNetwork(id)
	respond.JSON(w, http.StatusOK, respond.H{"result": result})
}
