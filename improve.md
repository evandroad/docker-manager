# Router — Melhorias

O router é um wrapper leve sobre http.ServeMux do Go 1.22+ (que já suporta METHOD /path). Evita dependências externas e aproveita o mux nativo. A ideia não é competir com fasthttp/fiber/chi — é aprender e ter algo sólido pra produção.

## ✅ Feito

- **http.Server com timeouts** — Substituído http.Serve por http.Server com ReadHeaderTimeout (10s) e IdleTimeout (120s).
- **Handle aplica middlewares** — Handle() agora passa pelo chain(), file server roda com Recovery/Logger.
- **Renomear Pat → Patch** — Corrigido no router e em todos os call sites.
- **Request ID middleware** — Gera ou propaga X-Request-ID em cada request.
- **Graceful shutdown** — SIGINT/SIGTERM → srv.Shutdown com timeout de 5s pra drenar conexões.
- **Middlewares separados em arquivos** — logger.go, recovery.go, requestid.go, jsonerrors.go, ratelimit.go.
- **MaxConcurrent middleware** — Limita requests simultâneas no servidor via channel semáforo.
- **RateLimit middleware** — Token bucket por IP com cleanup automático de clientes inativos.
- **Pool de buffers no respond.JSON** — sync.Pool de bytes.Buffer, zero alocação em regime.
- **JSON error writer como middleware** — Extraído pra jsonerrors.go, aplicado só no grupo /api. Handler() retorna direto o Mux.
- **Cache-Control nos assets estáticos** — JS/CSS recebem max-age=86400 (24h).

## 🔧 Pendente — Segurança

1. **Limite de body size** — Rotas POST como /api/images/import aceitam body ilimitado. Adicionar http.MaxBytesReader nos handlers de upload.
2. **Recovery sanitizar stack trace** — Ok pra dev, mas em produção o panic pode vazar info sensível. Logar stack só em debug mode.
3. **CORS headers** — Não é problema agora (localhost + webview), mas necessário se expor a API.
