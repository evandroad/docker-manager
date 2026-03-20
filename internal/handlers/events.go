package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/docker/docker/api/types/events"
	"github.com/docker/docker/client"
)

func Events(w http.ResponseWriter, r *http.Request) {
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
			name := msg.Actor.Attributes["name"]
			if name == "" {
				name = msg.Actor.ID
			}
			event := map[string]any{
				"Type":   string(msg.Type),
				"Action": string(msg.Action),
				"ID":     msg.Actor.ID,
				"Name":   name,
				"Time":   msg.Time,
			}
			data, _ := json.Marshal(event)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		case err := <-errs:
			fmt.Println("docker events error:", err)
			return
		}
	}
}
