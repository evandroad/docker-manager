package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

var SaveDialogFunc func(filename string) (string, bool)

type ImageInfo struct {
	ID      string
	Tags    []string
	Size    string
	Created int64
	UsedBy  []string
}

func formatSize(bytes int64) string {
	mb := float64(bytes) / 1024 / 1024
	if mb >= 1024 {
		return fmt.Sprintf("%.1f GB", mb/1024)
	}
	return fmt.Sprintf("%.1f MB", mb)
}

func Images() []ImageInfo {
	ctx := context.Background()
	var out []ImageInfo

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return out
	}

	list, err := cli.ImageList(ctx, image.ListOptions{})
	if err != nil {
		return out
	}

	containers, _ := cli.ContainerList(ctx, container.ListOptions{All: true})
	imageContainers := map[string][]string{}
	for _, c := range containers {
		imageContainers[c.ImageID] = append(imageContainers[c.ImageID], c.Names[0])
	}

	for _, img := range list {
		id := img.ID
		if len(id) > 19 {
			id = id[7:19]
		}
		out = append(out, ImageInfo{
			ID:      id,
			Tags:    img.RepoTags,
			Size:    formatSize(img.Size),
			Created: img.Created,
			UsedBy:  imageContainers[img.ID],
		})
	}

	return out
}

func PullImage(refStr string, out chan<- string) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	reader, err := cli.ImagePull(ctx, refStr, image.PullOptions{})
	if err != nil {
		return err
	}
	defer reader.Close()
	dec := json.NewDecoder(reader)
	for dec.More() {
		var msg json.RawMessage
		if err := dec.Decode(&msg); err != nil {
			break
		}
		out <- string(msg)
	}
	return nil
}

func RemoveImage(id string) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	_, err = cli.ImageRemove(ctx, id, image.RemoveOptions{Force: true, PruneChildren: true})
	return err
}

func TagImage(source, newTag string, keep bool) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	if err := cli.ImageTag(ctx, source, newTag); err != nil {
		return err
	}
	if !keep && source != newTag {
		cli.ImageRemove(ctx, source, image.RemoveOptions{})
	}
	return nil
}

type ImageDetail struct {
	ID      string            `json:"id"`
	Tags    []string          `json:"tags"`
	Size    string            `json:"size"`
	OS      string            `json:"os"`
	Arch    string            `json:"arch"`
	Created string            `json:"created"`
	Cmd     []string          `json:"cmd"`
	Env     []string          `json:"env"`
	Layers  []string          `json:"layers"`
	History []ImageHistoryRow `json:"history"`
}

type ImageHistoryRow struct {
	CreatedBy string `json:"created_by"`
	Size      string `json:"size"`
	Created   int64  `json:"created"`
}

func InspectImage(id string) (*ImageDetail, error) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	info, _, err := cli.ImageInspectWithRaw(ctx, id)
	if err != nil {
		return nil, err
	}
	d := &ImageDetail{
		ID:      info.ID,
		Tags:    info.RepoTags,
		Size:    formatSize(info.Size),
		OS:      info.Os,
		Arch:    info.Architecture,
		Created: info.Created,
		Layers:  info.RootFS.Layers,
	}
	if info.Config != nil {
		d.Cmd = info.Config.Cmd
		d.Env = info.Config.Env
	}
	hist, err := cli.ImageHistory(ctx, id)
	if err == nil {
		for _, h := range hist {
			d.History = append(d.History, ImageHistoryRow{
				CreatedBy: h.CreatedBy,
				Size:      formatSize(h.Size),
				Created:   h.Created,
			})
		}
	}
	return d, nil
}

func ExportImage(id string) (string, error) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return "", err
	}
	reader, err := cli.ImageSave(ctx, []string{id})
	if err != nil {
		return "", err
	}
	defer reader.Close()

	filename := strings.ReplaceAll(id, ":", "_") + ".tar"
	path, ok := SaveDialogFunc(filename)
	if !ok {
		return "", nil
	}
	f, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	io.Copy(f, reader)
	return path, nil
}

func ImportImage(path string) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	resp, err := cli.ImageLoad(ctx, f)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)
	return nil
}
