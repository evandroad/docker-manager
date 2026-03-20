package handlers

import (
	"docker-manager/internal/respond"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
)

func prefsPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "docker-manager", "prefs.json")
}

func PrefsLoad(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile(prefsPath())
	if err != nil {
		respond.JSON(w, http.StatusOK, respond.H{})
		return
	}
	var prefs map[string]any
	json.Unmarshal(data, &prefs)
	respond.JSON(w, http.StatusOK, prefs)
}

func PrefsSave(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if json.NewDecoder(r.Body).Decode(&body) != nil {
		respond.JSON(w, http.StatusBadRequest, respond.H{"error": "bad request"})
		return
	}
	path := prefsPath()
	os.MkdirAll(filepath.Dir(path), 0755)
	data, _ := json.Marshal(body)
	os.WriteFile(path, data, 0644)
	respond.JSON(w, http.StatusOK, respond.H{"result": "ok"})
}
