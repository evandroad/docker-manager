# Router.go

O router é um wrapper leve sobre http.ServeMux do Go 1.22+ (que já suporta METHOD /path). É uma abordagem boa — evita dependências externas e aproveita o mux nativo que já tem performance excelente. Não faz sentido trocar por chi/gin/echo
aqui.

Dito isso, tem pontos concretos pra melhorar:

## Performance

1. strings.HasPrefix em cada request — No Handler(), toda request passa por um check de prefixo. Pra rotas que não são /api/, o wrapper jsonErrorWriter é desnecessário mas o branch ainda executa. Isso é micro, mas o ideal seria aplicar o 
JSON error writer só no grupo /api via middleware, eliminando o check global.

2. respond.JSON aloca json.NewEncoder por chamada — Pra respostas de erro pequenas e fixas (404, 405), usar bytes pré-computados evita alocação.

3. Handle("/", ...) para arquivos estáticos — O http.FileServer serve bem, mas não seta Cache-Control. Como é uma app desktop com embed, adicionar cache headers nos assets estáticos (JS/CSS) evita re-parse desnecessário pelo WebView.

## Segurança

4. ~~http.Serve sem timeouts~~ ✅ — Substituído por http.Server com ReadHeaderTimeout (10s) e IdleTimeout (120s) em main.go.

5. Recovery expõe stack trace no log mas não sanitiza — Ok pra dev, mas se algum dia virar server remoto, o panic pode vazar info sensível.

6. Sem limite de body size — Rotas POST como /api/images/import e /api/compose/up aceitam body ilimitado. Um http.MaxBytesReader nos handlers de upload protege contra OOM.

7. Sem CORS headers — Não é problema agora (localhost + webview), mas se expor a API, precisa.

## Código

8. Pat deveria ser Patch — Inconsistência de naming. Del é aceitável como abreviação, mas Pat é confuso.

9. ~~Handle não aplica middlewares~~ ✅ — Handle() agora passa pelo chain(), file server roda com Recovery/Logger.