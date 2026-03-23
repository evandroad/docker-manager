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
