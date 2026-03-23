package router

import "net/http"

type Router struct {
	Mux *http.ServeMux
}

func New() *Router {
	return &Router{Mux: http.NewServeMux()}
}

func (r *Router) method(method, path string, h http.HandlerFunc) {
	r.Mux.HandleFunc(path, func(w http.ResponseWriter, req *http.Request) {
		if req.Method != method {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}
		h(w, req)
	})
}

func (r *Router) Get(path string, h http.HandlerFunc)  { r.method(http.MethodGet, path, h) }
func (r *Router) Post(path string, h http.HandlerFunc)  { r.method(http.MethodPost, path, h) }
func (r *Router) Put(path string, h http.HandlerFunc)   { r.method(http.MethodPut, path, h) }
func (r *Router) Pat(path string, h http.HandlerFunc)   { r.method(http.MethodPatch, path, h) }
func (r *Router) Del(path string, h http.HandlerFunc)   { r.method(http.MethodDelete, path, h) }

func (r *Router) Handle(path string, h http.Handler) { r.Mux.Handle(path, h) }
