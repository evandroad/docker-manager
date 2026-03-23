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
	id := r.PathValue("id")
	respond.Result(w, service.RemoveImage(id))
}

func ImageTag(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	tag := r.PathValue("tag")
	keep := r.PathValue("keep") == "1"
	respond.Result(w, service.TagImage(id, tag, keep))
}
