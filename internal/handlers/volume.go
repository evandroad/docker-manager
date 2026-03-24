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
	name := r.PathValue("name")
	respond.Result(w, service.RemoveVolume(name))
}

func VolumeCreate(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	respond.Result(w, service.CreateVolume(name))
}

func VolumeCopy(w http.ResponseWriter, r *http.Request) {
	source := r.PathValue("source")
	dest := r.PathValue("dest")
	overwrite := r.PathValue("overwrite") == "1"
	respond.Result(w, service.CopyVolume(source, dest, overwrite))
}
