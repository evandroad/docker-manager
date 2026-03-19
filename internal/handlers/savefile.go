package handlers

import (
	"encoding/json"
	"net/http"
	"os"
)

// SaveDialogFunc is set by main to provide the native GTK save dialog.
var SaveDialogFunc func(filename string) (path string, ok bool)

func SaveFile(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Filename string `json:"filename"`
		Content  string `json:"content"`
	}
	if json.NewDecoder(r.Body).Decode(&req) != nil || req.Content == "" {
		http.Error(w, "bad request", 400)
		return
	}
	if req.Filename == "" {
		req.Filename = "logs.log"
	}

	path, ok := SaveDialogFunc(req.Filename)
	if !ok {
		json.NewEncoder(w).Encode(map[string]string{"status": "cancelled"})
		return
	}

	if err := os.WriteFile(path, []byte(req.Content), 0644); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "path": path})
}
