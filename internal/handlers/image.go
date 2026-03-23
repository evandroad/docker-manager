package handlers

import (
	"docker-manager/internal/service"
	"docker-manager/internal/respond"
	"net/http"
)

func ImagesList(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, service.Images())
}

func ImageRemove(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	respond.Result(w, service.RemoveImage(id))
}

func ImageTag(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	tag := r.URL.Query().Get("tag")
	keep := r.URL.Query().Get("keep") == "1"
	respond.Result(w, service.TagImage(id, tag, keep))
}
