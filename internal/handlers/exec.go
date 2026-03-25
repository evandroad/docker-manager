package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

type resizeMsg struct {
	Type string `json:"type"`
	Cols uint   `json:"cols"`
	Rows uint   `json:"rows"`
}

func ContainerExec(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Error: "+err.Error()))
		return
	}

	execCfg := container.ExecOptions{
		Cmd:          []string{"/bin/sh", "-c", "if command -v bash >/dev/null 2>&1; then exec bash; else exec sh; fi"},
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          true,
	}
	exec, err := cli.ContainerExecCreate(ctx, id, execCfg)
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Error: "+err.Error()))
		return
	}

	resp, err := cli.ContainerExecAttach(ctx, exec.ID, container.ExecAttachOptions{Tty: true})
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Error: "+err.Error()))
		return
	}
	defer resp.Close()

	// container stdout -> websocket
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := resp.Reader.Read(buf)
			if n > 0 {
				conn.WriteMessage(websocket.TextMessage, buf[:n])
			}
			if err != nil {
				conn.Close()
				return
			}
		}
	}()

	// websocket -> container stdin (or resize)
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			return
		}
		var rm resizeMsg
		if json.Unmarshal(msg, &rm) == nil && rm.Type == "resize" && rm.Cols > 0 {
			cli.ContainerExecResize(ctx, exec.ID, container.ResizeOptions{Width: rm.Cols, Height: rm.Rows})
			continue
		}
		resp.Conn.Write(msg)
	}
}
