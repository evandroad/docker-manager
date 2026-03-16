package internal

import (
	"context"
	"docker-manager/internal/respond"
	"encoding/json"
	"fmt"
	"net/http"

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
