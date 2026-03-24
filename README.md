# Docker Manager

Aplicativo desktop para Linux que permite gerenciar containers Docker através de uma interface gráfica leve, construída com Go e WebView.

![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-API-2496ED?logo=docker&logoColor=white)
![Platform](https://img.shields.io/badge/Linux-Desktop-FCC624?logo=linux&logoColor=black)

## Funcionalidades

- **Dashboard** — painel inicial com resumo de recursos (containers, imagens, volumes, networks), versão do Docker, OS e arquitetura
- **Containers** — listar, iniciar, parar, reiniciar e remover containers, agrupados por projeto Docker Compose com estado colapsável persistido
- **Compose** — start, stop e down de stacks inteiras; Compose Up com streaming de output via modal (aceita arquivo YAML ou cole direto)
- **Imagens** — listar e remover imagens, com exibição de containers que as utilizam
- **Volumes** — listar e remover volumes, com tamanho em disco e containers vinculados
- **Networks** — listar e remover redes, com containers conectados
- **Logs** — visualizar logs de containers em tempo real com auto-scroll e exportação para arquivo via diálogo nativo GTK
- **Eventos** — página de eventos Docker em tempo real via SSE, com salvar e limpar
- **Hosts remotos** — conectar a Docker daemons remotos via túnel SSH (com suporte a senha via sshpass ou chave)
- **Preferências** — estado de grupos e configurações persistidos no servidor

## Tecnologias

| Camada    | Tecnologia                                                                 |
|-----------|---------------------------------------------------------------------------|
| Backend   | Go + [Docker Engine SDK](https://pkg.go.dev/github.com/docker/docker)    |
| Frontend  | [React 19](https://react.dev) + [Tailwind CSS 4](https://tailwindcss.com) + [Vite 8](https://vite.dev) |
| GUI       | [webview/webview_go](https://github.com/webview/webview_go) (WebKitGTK)  |
| Build     | [Bun](https://bun.sh) (frontend) + Make                                  |

## Pré-requisitos

- Go 1.25+
- Bun (para build do frontend)
- Docker instalado e rodando
- Usuário no grupo `docker` (ou acesso ao socket)
- Dependências do WebKitGTK:
  ```bash
  # Debian/Ubuntu/Mint
  sudo apt install libwebkit2gtk-4.1-dev
  ```
- Para conexão com hosts remotos via senha: `sshpass`

## Como rodar

```bash
git clone https://github.com/<seu-usuario>/docker-manager.git
cd docker-manager
cd frontend && bun install && bun run build && cd ..
go run .
```

## Build

```bash
make build
./docker-manager
```

O Makefile executa: atualiza versão do pacote via `git describe`, builda o frontend com Bun e compila o binário Go com flags de otimização.

## Pacote .deb

```bash
make deb
```

Para instalar/atualizar:

```bash
sudo dpkg -i docker-manager_*_amd64.deb
```

Para desinstalar:

```bash
sudo apt remove docker-manager
```

## Estrutura do projeto

```
docker-manager/
├── main.go                          # Servidor HTTP embutido + janela WebView
├── savedialog.go                    # Diálogos nativos GTK (salvar/abrir arquivo)
├── Makefile                         # Build: frontend + Go + .deb
├── internal/
│   ├── respond/respond.go           # Helper de resposta JSON
│   ├── handlers/
│   │   ├── container.go             # CRUD de containers
│   │   ├── compose.go               # Compose start/stop/down/up + open-file
│   │   ├── image.go                 # Listar/remover imagens
│   │   ├── volume.go                # Listar/remover volumes
│   │   ├── network.go               # Listar/remover redes
│   │   ├── events.go                # SSE de eventos Docker
│   │   ├── dashboard.go             # Info do dashboard
│   │   ├── hosts.go                 # CRUD de hosts remotos
│   │   ├── prefs.go                 # Preferências do usuário
│   │   └── savefile.go              # Salvar arquivo via diálogo nativo
│   └── service/
│       ├── container.go             # Lógica Docker: containers + compose
│       ├── image.go                 # Lógica Docker: imagens
│       ├── volume.go                # Lógica Docker: volumes
│       ├── network.go               # Lógica Docker: redes
│       ├── dashboard.go             # Coleta de métricas do Docker
│       └── tunnel.go                # Túnel SSH para hosts remotos
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # Layout principal com sidebar e navegação
│   │   ├── api.ts                   # Cliente HTTP para a API Go
│   │   ├── types.ts                 # Tipos TypeScript
│   │   ├── useDockerEvents.ts       # Hook SSE de eventos
│   │   ├── useSort.ts               # Hook de ordenação de tabelas
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Dashboard com cards de resumo
│   │   │   ├── ContainersPage.tsx   # Listagem agrupada de containers
│   │   │   ├── ImagesPage.tsx       # Listagem de imagens
│   │   │   ├── VolumesPage.tsx      # Listagem de volumes
│   │   │   ├── NetworksPage.tsx     # Listagem de redes
│   │   │   └── EventsPage.tsx       # Feed de eventos em tempo real
│   │   └── components/
│   │       ├── GroupRows.tsx         # Linhas agrupadas por projeto Compose
│   │       ├── ComposeModal.tsx      # Modal de Compose Up
│   │       ├── LogModal.tsx          # Modal de logs em streaming
│   │       ├── ConfirmModal.tsx      # Diálogo de confirmação
│   │       ├── HostEditor.tsx        # Editor de hosts remotos
│   │       └── PasswordModal.tsx     # Modal de senha SSH
│   └── vite.config.ts
├── deb-pkg/                         # Estrutura do pacote Debian
├── go.mod
└── go.sum
```

## Como funciona

1. O `main.go` inicia um servidor HTTP local em porta efêmera (`127.0.0.1:0`) que serve os arquivos estáticos do frontend (embarcados via `embed`) e a API REST.
2. Uma janela nativa é aberta via WebView apontando para o servidor local.
3. O frontend React se comunica com o backend via chamadas HTTP à API.
4. Eventos do Docker são transmitidos em tempo real pelo endpoint SSE `/api/events`, atualizando o estado na interface sem polling.
5. Para hosts remotos, um túnel SSH é criado encaminhando o socket Docker remoto para um socket local temporário.

## Roadmap

Funcionalidades planejadas:

1. **Busca/filtro** — campo de texto para filtrar tabelas em tempo real
2. **Copiar ID/nome com um clique**
3. **Prune de recursos** — botões para `docker system/volume/image prune`
4. **Inspeção de imagens** — layers, histórico de build e configuração
5. **Exec/terminal no container** — shell interativo
6. **Notificações de eventos** — toasts/alertas visuais
7. **Gerenciamento de registries** — login/logout em registries privados
8. **Backup e restore de volumes** — exportar/importar como tar
9. **Templates de stacks** — biblioteca de docker-compose templates
10. **RBAC e autenticação** — controle de acesso por usuário
