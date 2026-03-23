package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"docker-manager/internal/service"
)

func ContainerStatsStream(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", 500)
		return
	}

	ctx := r.Context()

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		stats := service.CollectStats(ctx)
		data, _ := json.Marshal(stats)
		fmt.Fprintf(w, "data: %s\n\n", data)
		flusher.Flush()

		select {
		case <-ctx.Done():
			return
		case <-time.After(1 * time.Second):
		}
	}
}
