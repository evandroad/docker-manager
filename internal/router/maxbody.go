package router

import "net/http"

// MaxBody limita o tamanho do request body. Requests que excedem recebem 413.
func MaxBody(bytes int64) Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if r.ContentLength > bytes {
				http.Error(w, `{"error":"Request Entity Too Large"}`, http.StatusRequestEntityTooLarge)
				return
			}
			r.Body = http.MaxBytesReader(w, r.Body, bytes)
			next(w, r)
		}
	}
}
