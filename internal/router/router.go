package router

import (
	"docker-manager/internal/respond"
	"net/http"
	"strings"
)

type Middleware func(http.HandlerFunc) http.HandlerFunc

type Router struct {
	Mux         *http.ServeMux
	prefix      string
	middlewares []Middleware
}

func New() *Router {
	return &Router{Mux: http.NewServeMux()}
}

func (r *Router) Use(mw ...Middleware) {
	r.middlewares = append(r.middlewares, mw...)
}

func (r *Router) Group(prefix string, fn func(g *Router)) {
	g := &Router{
		Mux:         r.Mux,
		prefix:      r.prefix + prefix,
		middlewares:  append([]Middleware{}, r.middlewares...),
	}
	fn(g)
}

func (r *Router) chain(h http.HandlerFunc) http.HandlerFunc {
	for i := len(r.middlewares) - 1; i >= 0; i-- {
		h = r.middlewares[i](h)
	}
	return h
}

func (r *Router) method(method, path string, h http.HandlerFunc) {
	full := method + " " + r.prefix + path
	r.Mux.HandleFunc(full, r.chain(h))
}

func (r *Router) Get(path string, h http.HandlerFunc)  { r.method(http.MethodGet, path, h) }
func (r *Router) Post(path string, h http.HandlerFunc) { r.method(http.MethodPost, path, h) }
func (r *Router) Put(path string, h http.HandlerFunc)  { r.method(http.MethodPut, path, h) }
func (r *Router) Pat(path string, h http.HandlerFunc)  { r.method(http.MethodPatch, path, h) }
func (r *Router) Del(path string, h http.HandlerFunc)  { r.method(http.MethodDelete, path, h) }

func (r *Router) Handle(path string, h http.Handler) {
	r.Mux.HandleFunc(r.prefix+path, r.chain(h.ServeHTTP))
}

func (r *Router) Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if strings.HasPrefix(req.URL.Path, "/api/") {
			rec := &jsonErrorWriter{ResponseWriter: w}
			r.Mux.ServeHTTP(rec, req)
			return
		}
		r.Mux.ServeHTTP(w, req)
	})
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
