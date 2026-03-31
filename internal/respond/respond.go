package respond

import (
	"bytes"
	"encoding/json"
	"net/http"
	"sync"
)

type H map[string]any

var bufPool = sync.Pool{
	New: func() any { return new(bytes.Buffer) },
}

func JSON(w http.ResponseWriter, status int, data any) {
	buf := bufPool.Get().(*bytes.Buffer)
	buf.Reset()
	defer bufPool.Put(buf)

	if err := json.NewEncoder(buf).Encode(data); err != nil {
		http.Error(w, `{"error":"encode failed"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	w.Write(buf.Bytes())
}

func Result(w http.ResponseWriter, err error) {
	if err != nil {
		JSON(w, http.StatusOK, H{"ok": false, "error": err.Error()})
	} else {
		JSON(w, http.StatusOK, H{"ok": true})
	}
}
