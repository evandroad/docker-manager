# Docker Manager

Aplicativo desktop para Linux que permite gerenciar containers Docker através de uma interface gráfica leve, construída com Go e WebView.

![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-API-2496ED?logo=docker&logoColor=white)
![Platform](https://img.shields.io/badge/Linux-Desktop-FCC624?logo=linux&logoColor=black)

## Funcionalidades

- Listar todos os containers (rodando e parados), agrupados por projeto Docker Compose
- Iniciar e parar containers pela interface
- Atualização em tempo real via Server-Sent Events (SSE) — o estado dos containers reflete mudanças automaticamente
- Navegação por abas: Containers, Images, Volumes, Networks
- Grupos colapsáveis com estado persistido no localStorage

## Tecnologias

| Camada    | Tecnologia                                                                 |
|-----------|---------------------------------------------------------------------------|
| Backend   | Go + [Docker Engine SDK](https://pkg.go.dev/github.com/docker/docker)    |
| Frontend  | HTML/CSS/JS puro (embarcado no binário via `embed`)                       |
| GUI       | [webview/webview_go](https://github.com/webview/webview_go) (WebKitGTK)  |

## Pré-requisitos

- Go 1.25+
- Docker instalado e rodando
- Usuário no grupo `docker` (ou acesso ao socket)
- Dependências do WebKitGTK:
  ```bash
  # Debian/Ubuntu/Mint
  sudo apt install libwebkit2gtk-4.1-dev
  ```

## Como rodar

```bash
git clone https://github.com/<seu-usuario>/docker-manager.git
cd docker-manager
go run .
```

Para gerar o binário:

```bash
go build -o docker-manager .
./docker-manager
```

## Estrutura do projeto

```
docker-manager/
├── main.go              # Entrypoint: servidor HTTP embutido + janela WebView
├── internal/
│   └── container.go     # Operações Docker (listar, iniciar, parar)
├── web/
│   ├── index.html       # Interface principal
│   ├── style.css        # Tema escuro
│   └── app.js           # Lógica do frontend (tabela, SSE, navegação)
├── go.mod
└── go.sum
```

## Como funciona

1. O `main.go` inicia um servidor HTTP local (`127.0.0.1:1234`) que serve os arquivos estáticos embarcados e um endpoint `/events` (SSE).
2. Uma janela nativa é aberta via WebView apontando para o servidor local.
3. O frontend chama funções Go diretamente via bindings do WebView (`containers`, `startContainer`, `stopContainer`).
4. Eventos do Docker são transmitidos em tempo real pelo endpoint SSE, atualizando o estado dos containers na interface sem polling.

## Licença

Este projeto é de uso pessoal/educacional. Adicione uma licença conforme necessário.
