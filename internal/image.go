package internal

import (
	"context"
	"fmt"

	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
)

type ImageInfo struct {
	ID      string
	Tags    []string
	Size    string
	Created int64
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
		})
	}

	return out
}
