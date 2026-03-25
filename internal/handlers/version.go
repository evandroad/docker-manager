package handlers

import (
	"docker-manager/internal/respond"
	"net/http"
)

var AppVersion string

func Version(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, respond.H{"version": AppVersion})
}
