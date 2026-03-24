package handlers

import (
	"docker-manager/internal/respond"
	"docker-manager/internal/service"
	"fmt"
	"net/http"
)

func ImagesList(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, service.Images())
}

func ImageRemove(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	respond.Result(w, service.RemoveImage(id))
}

func ImagePull(w http.ResponseWriter, r *http.Request) {
	ref := r.URL.Query().Get("ref")
	if ref == "" {
		respond.JSON(w, http.StatusBadRequest, respond.H{"ok": false, "error": "missing ref"})
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	flusher, _ := w.(http.Flusher)
	ch := make(chan string, 16)
	go func() {
		err := service.PullImage(ref, ch)
		if err != nil {
			ch <- "ERROR:" + err.Error()
		}
		close(ch)
	}()
	for msg := range ch {
		fmt.Fprintf(w, "data: %s\n\n", msg)
		if flusher != nil {
			flusher.Flush()
		}
	}
}

func ImageTag(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag := r.PathValue("tag")
	keep := r.PathValue("keep") == "1"
	respond.Result(w, service.TagImage(id, tag, keep))
}

func ImageSearch(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		respond.JSON(w, http.StatusOK, []any{})
		return
	}
	results, err := service.SearchHub(q)
	if err != nil {
		respond.JSON(w, http.StatusOK, []any{})
		return
	}
	respond.JSON(w, http.StatusOK, results)
}

func ImageSearchTags(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		respond.JSON(w, http.StatusOK, []any{})
		return
	}
	tags, err := service.HubTags(name)
	if err != nil {
		respond.JSON(w, http.StatusOK, []any{})
		return
	}
	respond.JSON(w, http.StatusOK, tags)
}
