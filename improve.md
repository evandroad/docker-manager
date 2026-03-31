# Router — Melhorias

O router é um wrapper leve sobre http.ServeMux do Go 1.22+ (que já suporta METHOD /path). Evita dependências externas e aproveita o mux nativo. A ideia não é competir com fasthttp/fiber/chi — é aprender e ter algo sólido pra produção.

## ✅ Feito

- **http.Server com timeouts** — Substituído http.Serve por http.Server com ReadHeaderTimeout (10s) e IdleTimeout (120s).
- **Handle aplica middlewares** — Handle() agora passa pelo chain(), file server roda com Recovery/Logger.
- **Renomear Pat → Patch** — Corrigido no router e em todos os call sites.
- **Request ID middleware** — Gera ou propaga X-Request-ID em cada request.
- **Graceful shutdown** — SIGINT/SIGTERM → srv.Shutdown com timeout de 5s pra drenar conexões.
- **Middlewares separados em arquivos** — logger.go, recovery.go, requestid.go.
- **MaxConcurrent middleware** — Limita requests simultâneas no servidor via channel semáforo.
- **RateLimit middleware** — Token bucket por IP com cleanup automático de clientes inativos.

## 🔧 Pendente — Performance

1. **Pool de buffers no respond.JSON** — Usar sync.Pool pra reutilizar bytes.Buffer no encoding JSON. Evita alocação por response.
2. **strings.HasPrefix em cada request** — Mover o JSON error writer pra middleware do grupo /api em vez de check global no Handler().
3. **Cache-Control nos assets estáticos** — http.FileServer não seta cache headers. Adicionar pra JS/CSS evitar re-parse no WebView.

## 🔧 Pendente — Segurança

4. **Limite de body size** — Rotas POST como /api/images/import aceitam body ilimitado. Adicionar http.MaxBytesReader nos handlers de upload.
5. **Recovery sanitizar stack trace** — Ok pra dev, mas em produção o panic pode vazar info sensível. Logar stack só em debug mode.
6. **CORS headers** — Não é problema agora (localhost + webview), mas necessário se expor a API.

## 🔧 Pendente — Produção

(vazio)
