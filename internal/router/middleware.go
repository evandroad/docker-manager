package router

import (
	"bufio"
	"docker-manager/internal/respond"
	"fmt"
	"net"
	"net/http"
	"runtime/debug"
	"time"
)

const (
	reset  = "\033[0m"
	green  = "\033[32m"
	yellow = "\033[33m"
	cyan   = "\033[36m"
	blue   = "\033[34m"
	red    = "\033[31m"
)

type statusWriter struct {
	http.ResponseWriter
	status, size int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *statusWriter) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.size += n
	return n, err
}

func (w *statusWriter) Flush() {
	if f, ok := w.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func (w *statusWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if hj, ok := w.ResponseWriter.(http.Hijacker); ok {
		return hj.Hijack()
	}
	return nil, nil, fmt.Errorf("http.Hijacker not supported")
}

func Logger(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		inSize := max(r.ContentLength, 0)
		sw := &statusWriter{ResponseWriter: w, status: 200}

		isStream := r.Header.Get("Accept") == "text/event-stream" ||
			r.URL.Path == "/api/events" ||
			r.URL.Path == "/api/containers/stats"
		if isStream {
			fmt.Printf("[DKM] %s | %s%s%s from %s - %sSTREAM OPEN%s\n",
				time.Now().Format("06/01/02 15:04:05.000"),
				cyan, r.Method+" "+r.URL.String(), reset,
				r.RemoteAddr,
				green, reset,
			)
		}

		next(sw, r)
		statusColor := green

		if sw.status >= 400 {
			statusColor = yellow
		}

		if sw.status >= 500 {
			statusColor = red
		}

		label := ""
		if isStream {
			label = "STREAM CLOSED "
		}

		fmt.Printf("[DKM] %s | %s%s%s from %s - %s%s%d%s %s↓%s ↑%s%s in %s%s%s\n",
			time.Now().Format("06/01/02 15:04:05.000"),
			cyan, r.Method+" "+r.URL.String(), reset,
			r.RemoteAddr,
			statusColor, label, sw.status, reset,
			blue, formatSize(int(inSize)), formatSize(sw.size), reset,
			green, time.Since(start), reset,
		)
	}
}

func Recovery(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				fmt.Printf("[DKM] %s | %sPANIC%s %s %s: %v\n%s",
					time.Now().Format("06/01/02 15:04:05.000"),
					red, reset, r.Method, r.URL.Path, err, debug.Stack())
				respond.JSON(w, http.StatusInternalServerError, respond.H{"error": "Internal Server Error"})
			}
		}()
		next(w, r)
	}
}

func formatSize(b int) string {
	switch {
	case b >= 1024*1024:
		return fmt.Sprintf("%.1fMB", float64(b)/(1024*1024))
	case b >= 1024:
		return fmt.Sprintf("%.1fKB", float64(b)/1024)
	default:
		return fmt.Sprintf("%dB", b)
	}
}
