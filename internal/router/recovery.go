package router

import (
	"docker-manager/internal/respond"
	"fmt"
	"net/http"
	"runtime/debug"
	"time"
)

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
