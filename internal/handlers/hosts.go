package handlers

import (
	"docker-manager/internal/respond"
	"docker-manager/internal/service"
	"encoding/json"
	"net/http"
)

func HostsList(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, respond.H{
		"hosts":  service.LoadHosts(),
		"active": service.ActiveHost(),
	})
}

func HostsSave(w http.ResponseWriter, r *http.Request) {
	var hosts []service.HostConfig
	if json.NewDecoder(r.Body).Decode(&hosts) != nil {
		respond.JSON(w, http.StatusBadRequest, respond.H{"error": "bad request"})
		return
	}
	if err := service.SaveHosts(hosts); err != nil {
		respond.JSON(w, 500, respond.H{"error": err.Error()})
		return
	}
	respond.JSON(w, http.StatusOK, respond.H{"result": "ok"})
}

func HostConnect(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	password := r.URL.Query().Get("password")
	if err := service.ConnectHost(name, password); err != nil {
		respond.JSON(w, 500, respond.H{"error": err.Error()})
		return
	}
	respond.JSON(w, http.StatusOK, respond.H{"result": "ok", "active": service.ActiveHost()})
}
