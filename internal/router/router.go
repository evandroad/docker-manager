package router

import (
	"docker-manager/internal/respond"
	"net/http"
)

type Router struct {
	Mux    *http.ServeMux
	prefix string
}

func New() *Router {
	return &Router{Mux: http.NewServeMux()}
}

func (r *Router) Group(prefix string, fn func(g *Router)) {
	g := &Router{Mux: r.Mux, prefix: r.prefix + prefix}
	fn(g)
}

func (r *Router) method(method, path string, h http.HandlerFunc) {
	full := r.prefix + path
	r.Mux.HandleFunc(full, func(w http.ResponseWriter, req *http.Request) {
		if req.Method != method {
			respond.JSON(w, http.StatusMethodNotAllowed, respond.H{"error": "Method Not Allowed"})
			return
		}
		h(w, req)
	})
}

func (r *Router) Get(path string, h http.HandlerFunc)  { r.method(http.MethodGet, path, h) }
func (r *Router) Post(path string, h http.HandlerFunc) { r.method(http.MethodPost, path, h) }
func (r *Router) Put(path string, h http.HandlerFunc)  { r.method(http.MethodPut, path, h) }
func (r *Router) Pat(path string, h http.HandlerFunc)  { r.method(http.MethodPatch, path, h) }
func (r *Router) Del(path string, h http.HandlerFunc)  { r.method(http.MethodDelete, path, h) }

func (r *Router) Handle(path string, h http.Handler) { r.Mux.Handle(r.prefix+path, h) }
