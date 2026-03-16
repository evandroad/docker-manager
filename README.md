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

## Pacote .deb

Para gerar o instalador:

```bash
go build -ldflags="-s -w" -o deb-pkg/usr/local/bin/docker-manager
dpkg-deb --build deb-pkg docker-manager_1.0.0_amd64.deb
```

Para instalar/atualizar:

```bash
sudo dpkg -i docker-manager_1.0.0_amd64.deb
```

Para desinstalar:

```bash
sudo apt remove docker-manager
```

Ao atualizar, incrementar a versão em `deb-pkg/DEBIAN/control` antes de rebuildar.

## Roadmap

Funcionalidades planejadas, ordenadas da mais simples à mais complexa:

1. **Busca/filtro de containers, imagens, volumes e networks** — campo de texto para filtrar as tabelas em tempo real
2. **Copiar ID/nome com um clique** — botão de copiar ao lado do ID e nome dos recursos
3. **Prune de recursos** — botões para executar `docker system prune`, `docker volume prune`, `docker image prune`
4. **Renomear containers** — editar o nome de um container diretamente na tabela
5. **Restart de containers** — botão de restart individual e por grupo compose
6. **Detalhes do container em painel lateral** — exibir portas, variáveis de ambiente, mounts, redes e labels
7. **Inspeção de imagens** — exibir layers, histórico de build e configuração
8. **Pull de imagens** — campo para digitar o nome da imagem e fazer pull com barra de progresso
9. **Criação de volumes e networks** — formulários para criar novos recursos
10. **Logs de containers** — visualizar logs em tempo real com tail e busca
11. **Exec/terminal no container** — abrir um shell interativo dentro de um container
12. **Estatísticas de recursos (CPU/memória/rede)** — gráficos em tempo real por container usando `docker stats`
13. **Gerenciamento de Docker Compose** — up, down, pull, build e restart de stacks inteiras a partir do compose file
14. **Notificações de eventos** — toasts/alertas visuais quando containers caem, reiniciam ou dão erro
15. **Gerenciamento de registries** — login/logout em registries privados, listar imagens remotas
16. **Dashboard com visão geral** — painel inicial com resumo de recursos, uso de disco, containers por estado
17. **Gerenciamento multi-host** — conectar a Docker daemons remotos via TCP/SSH
18. **Backup e restore de volumes** — exportar/importar dados de volumes como arquivos tar
19. **Templates de stacks** — biblioteca de docker-compose templates prontos para deploy rápido
20. **RBAC e autenticação** — controle de acesso por usuário com permissões granulares

## Licença

Este projeto é de uso pessoal/educacional. Adicione uma licença conforme necessário.
