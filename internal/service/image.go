package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

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
