package handlers

import (
	"docker-manager/internal/service"
	"docker-manager/internal/respond"
	"net/http"
)

func NetworksList(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, service.Networks())
}

func NetworkRemove(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	respond.Result(w, service.RemoveNetwork(id))
}

func NetworkCreate(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	driver := r.PathValue("driver")
	respond.Result(w, service.CreateNetwork(name, driver))
}
