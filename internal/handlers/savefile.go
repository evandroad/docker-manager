package handlers

import (
	"docker-manager/internal/respond"
	"encoding/json"
	"net/http"
	"os"
)

// SaveDialogFunc is set by main to provide the native GTK save dialog.
var SaveDialogFunc func(filename string) (path string, ok bool)

var OpenTarDialogFunc func() (path string, ok bool)

func SaveFile(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Filename string `json:"filename"`
		Content  string `json:"content"`
	}
	if json.NewDecoder(r.Body).Decode(&req) != nil || req.Content == "" {
		respond.JSON(w, http.StatusBadRequest, respond.H{"error": "bad request"})
		return
	}
	if req.Filename == "" {
		req.Filename = "logs.log"
	}

	path, ok := SaveDialogFunc(req.Filename)
	if !ok {
		respond.JSON(w, http.StatusOK, respond.H{"status": "cancelled"})
		return
	}

	if err := os.WriteFile(path, []byte(req.Content), 0644); err != nil {
		respond.JSON(w, http.StatusInternalServerError, respond.H{"error": err.Error()})
		return
	}

	respond.JSON(w, http.StatusOK, respond.H{"status": "ok", "path": path})
}
