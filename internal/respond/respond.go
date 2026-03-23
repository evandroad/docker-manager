package respond

import (
	"encoding/json"
	"net/http"
)

type H map[string]any

func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func Result(w http.ResponseWriter, err error) {
	if err != nil {
		JSON(w, http.StatusOK, H{"ok": false, "error": err.Error()})
	} else {
		JSON(w, http.StatusOK, H{"ok": true})
	}
}
