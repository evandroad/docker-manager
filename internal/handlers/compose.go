package handlers

import (
	"bufio"
	"docker-manager/internal/respond"
	"docker-manager/internal/service"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

// OpenFileDialogFunc is set by main to provide the native GTK open dialog.
var OpenFileDialogFunc func() (path string, ok bool)

func ComposeStart(w http.ResponseWriter, r *http.Request) {
	project := r.PathValue("project")
	service.ComposeStart(project)
	respond.Result(w, nil)
}

func ComposeStop(w http.ResponseWriter, r *http.Request) {
	project := r.PathValue("project")
	service.ComposeStop(project)
	respond.Result(w, nil)
}

func ComposeDown(w http.ResponseWriter, r *http.Request) {
	project := r.PathValue("project")
	service.ComposeDown(project)
	respond.Result(w, nil)
}

func ComposeUp(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Path string
		Yaml string
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respond.JSON(w, http.StatusBadRequest, respond.H{"error": "bad request"})
		return
	}

	var cmd *exec.Cmd
	var tmpFile string

	if body.Path != "" {
		cmd = exec.Command("docker", "compose", "-f", body.Path, "up", "-d")
		cmd.Dir = filepath.Dir(body.Path)
	} else if body.Yaml != "" {
		f, err := os.CreateTemp("", "compose-*.yml")
		if err != nil {
			respond.JSON(w, http.StatusInternalServerError, respond.H{"error": err.Error()})
			return
		}
		tmpFile = f.Name()
		f.WriteString(body.Yaml)
		f.Close()
		cmd = exec.Command("docker", "compose", "-f", tmpFile, "up", "-d")
	} else {
		respond.JSON(w, http.StatusBadRequest, respond.H{"error": "path or yaml required"})
		return
	}

	// Merge stdout+stderr into one pipe
	pr, pw := io.Pipe()
	cmd.Stdout = pw
	cmd.Stderr = pw

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", 500)
		return
	}

	if err := cmd.Start(); err != nil {
		encoded, _ := json.Marshal(err.Error())
		fmt.Fprintf(w, "event: error\ndata: %s\n\n", encoded)
		flusher.Flush()
		return
	}

	go func() {
		cmd.Wait()
		if tmpFile != "" {
			os.Remove(tmpFile)
		}
		pw.Close()
	}()

	scanner := bufio.NewScanner(pr)
	for scanner.Scan() {
		encoded, _ := json.Marshal(scanner.Text())
		fmt.Fprintf(w, "data: %s\n\n", encoded)
		flusher.Flush()
	}

	fmt.Fprintf(w, "event: done\ndata: \"ok\"\n\n")
	flusher.Flush()
}

func ComposeOpenFile(w http.ResponseWriter, r *http.Request) {
	path, ok := OpenFileDialogFunc()
	if !ok {
		respond.JSON(w, http.StatusOK, respond.H{"path": ""})
		return
	}
	respond.JSON(w, http.StatusOK, respond.H{"path": path})
}
