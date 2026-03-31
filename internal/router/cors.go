package router

import "net/http"

type CORSConfig struct {
	Origin  string
	Methods string
	Headers string
}

func CORS(cfg CORSConfig) Middleware {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", cfg.Origin)
			w.Header().Set("Access-Control-Allow-Methods", cfg.Methods)
			w.Header().Set("Access-Control-Allow-Headers", cfg.Headers)
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next(w, r)
		}
	}
}
