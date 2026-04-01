package router

import (
	"bufio"
	"docker-manager/internal/respond"
	"fmt"
	"net"
	"net/http"
)

func JSONErrors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rec := &jsonErrorWriter{ResponseWriter: w}
		next(rec, r)
	}
}

type jsonErrorWriter struct {
	http.ResponseWriter
	done bool
}

func (j *jsonErrorWriter) WriteHeader(code int) {
	if code == http.StatusMethodNotAllowed || code == http.StatusNotFound {
		j.done = true
		msg := "Not Found"
		if code == http.StatusMethodNotAllowed {
			msg = "Method Not Allowed"
		}
		respond.JSON(j.ResponseWriter, code, respond.H{"error": msg})
		return
	}
	j.ResponseWriter.WriteHeader(code)
}

func (j *jsonErrorWriter) Write(b []byte) (int, error) {
	if j.done {
		return len(b), nil
	}
	return j.ResponseWriter.Write(b)
}

func (j *jsonErrorWriter) Flush() {
	if f, ok := j.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func (j *jsonErrorWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if h, ok := j.ResponseWriter.(http.Hijacker); ok {
		return h.Hijack()
	}
	return nil, nil, fmt.Errorf("underlying ResponseWriter does not support Hijack")
}
