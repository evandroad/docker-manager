package handlers

import (
	"docker-manager/internal/respond"
	"docker-manager/internal/service"
	"net/http"
)

func DashboardInfo(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, service.Dashboard())
}
