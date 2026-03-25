package service

import (
	"archive/tar"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

type ActiveTask struct {
	Type        string `json:"type"`
	VolumeName  string `json:"volume_name"`
	ContainerID string `json:"container_id"`
	SavePath    string `json:"save_path,omitempty"`
}

var (
	taskMu   sync.Mutex
	taskFile string
)

func init() {
	home, _ := os.UserHomeDir()
	dir := filepath.Join(home, ".config", "docker-manager")
	os.MkdirAll(dir, 0755)
	taskFile = filepath.Join(dir, "task.json")
}

func SaveTask(task *ActiveTask) {
	taskMu.Lock()
	defer taskMu.Unlock()
	if task == nil {
		os.Remove(taskFile)
		return
	}
	data, _ := json.Marshal(task)
	os.WriteFile(taskFile, data, 0644)
}

func LoadTask() *ActiveTask {
	taskMu.Lock()
	defer taskMu.Unlock()
	data, err := os.ReadFile(taskFile)
	if err != nil {
		return nil
	}
	var task ActiveTask
	if json.Unmarshal(data, &task) != nil {
		return nil
	}
	return &task
}

// CompleteExportTask finishes a resumed export by copying the tar from the container.
func CompleteExportTask(task *ActiveTask, progress func(string)) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	info, err := cli.ContainerInspect(ctx, task.ContainerID)
	if err != nil {
		return fmt.Errorf("container not found on current host")
	}
	defer func() {
		cli.ContainerRemove(ctx, task.ContainerID, container.RemoveOptions{})
		SaveTask(nil)
	}()
	if info.State.Running {
		progress("Waiting for compression to finish…")
		waitCh, errCh := cli.ContainerWait(ctx, task.ContainerID, container.WaitConditionNotRunning)
		select {
		case res := <-waitCh:
			if res.StatusCode != 0 {
				return fmt.Errorf("tar failed with exit code %d", res.StatusCode)
			}
		case e := <-errCh:
			return e
		}
	}
	if task.SavePath == "" {
		return nil
	}
	stat, _ := cli.ContainerStatPath(ctx, task.ContainerID, "/backup.tar.gz")
	totalStr := ""
	if stat.Size > 0 {
		totalStr = formatVolSize(stat.Size)
	}
	progress("Starting download…")
	reader, _, err := cli.CopyFromContainer(ctx, task.ContainerID, "/backup.tar.gz")
	if err != nil {
		return err
	}
	defer reader.Close()
	f, err := os.Create(task.SavePath)
	if err != nil {
		return err
	}
	defer f.Close()
	tr := tar.NewReader(reader)
	if _, err := tr.Next(); err != nil {
		return err
	}
	buf := make([]byte, 256*1024)
	var written int64
	lastReport := time.Now()
	for {
		n, readErr := tr.Read(buf)
		if n > 0 {
			f.Write(buf[:n])
			written += int64(n)
			if time.Since(lastReport) > 3*time.Second {
				if totalStr != "" {
					progress(fmt.Sprintf("Downloading… %s / %s", formatVolSize(written), totalStr))
				} else {
					progress(fmt.Sprintf("Downloading… %s", formatVolSize(written)))
				}
				lastReport = time.Now()
			}
		}
		if readErr != nil {
			break
		}
	}
	return nil
}

func CancelTask() error {
	task := LoadTask()
	if task == nil {
		return nil
	}
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		SaveTask(nil)
		return nil
	}
	cli.ContainerKill(ctx, task.ContainerID, "KILL")
	cli.ContainerRemove(ctx, task.ContainerID, container.RemoveOptions{Force: true})
	SaveTask(nil)
	return nil
}
