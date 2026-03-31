package router

import (
	"net/http"
	"sync"
	"time"
)

func MaxConcurrent(n int) Middleware {
	sem := make(chan struct{}, n)
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			select {
			case sem <- struct{}{}:
				defer func() { <-sem }()
				next(w, r)
			default:
				http.Error(w, `{"error":"Too Many Requests"}`, http.StatusTooManyRequests)
			}
		}
	}
}

// RateLimit limita requests por IP usando token bucket.
// rate = tokens adicionados por segundo, burst = máximo de tokens acumulados.
func RateLimit(rate float64, burst int) Middleware {
	var mu sync.Mutex
	clients := make(map[string]*bucket)

	go func() {
		for range time.Tick(5 * time.Minute) {
			mu.Lock()
			now := time.Now()
			for ip, b := range clients {
				if now.Sub(b.last) > 5*time.Minute {
					delete(clients, ip)
				}
			}
			mu.Unlock()
		}
	}()

	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr

			mu.Lock()
			b, ok := clients[ip]
			if !ok {
				b = &bucket{tokens: float64(burst), last: time.Now()}
				clients[ip] = b
			}
			now := time.Now()
			b.tokens += now.Sub(b.last).Seconds() * rate
			if b.tokens > float64(burst) {
				b.tokens = float64(burst)
			}
			b.last = now

			if b.tokens < 1 {
				mu.Unlock()
				http.Error(w, `{"error":"Too Many Requests"}`, http.StatusTooManyRequests)
				return
			}
			b.tokens--
			mu.Unlock()

			next(w, r)
		}
	}
}

type bucket struct {
	tokens float64
	last   time.Time
}
