package handlers

import (
	"docker-manager/internal/service"
	"docker-manager/internal/respond"
	"net/http"
)

func ComposeStart(w http.ResponseWriter, r *http.Request) {
	project := r.URL.Query().Get("project")
	respond.JSON(w, http.StatusOK, respond.H{"result": service.ComposeStart(project)})
}

func ComposeStop(w http.ResponseWriter, r *http.Request) {
	project := r.URL.Query().Get("project")
	respond.JSON(w, http.StatusOK, respond.H{"result": service.ComposeStop(project)})
}
