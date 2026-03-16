package handlers

import (
	"docker-manager/internal/service"
	"docker-manager/internal/respond"
	"net/http"
)

func VolumesList(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, service.Volumes())
}

func VolumeRemove(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	respond.JSON(w, http.StatusOK, respond.H{"result": service.RemoveVolume(name)})
}
