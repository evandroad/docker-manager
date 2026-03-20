package service

import (
	"context"
	"runtime"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
)

type DashboardInfo struct {
	Containers     int
	Running        int
	Stopped        int
	Images         int
	Volumes        int
	Networks       int
	DockerVersion  string
	OS             string
	Architecture   string
}

func Dashboard() DashboardInfo {
	ctx := context.Background()
	info := DashboardInfo{
		OS:           runtime.GOOS,
		Architecture: runtime.GOARCH,
	}

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return info
	}

	if sv, err := cli.ServerVersion(ctx); err == nil {
		info.DockerVersion = sv.Version
	}

	if list, err := cli.ContainerList(ctx, container.ListOptions{All: true}); err == nil {
		info.Containers = len(list)
		for _, c := range list {
			if c.State == "running" {
				info.Running++
			} else {
				info.Stopped++
			}
		}
	}

	if list, err := cli.ImageList(ctx, image.ListOptions{}); err == nil {
		info.Images = len(list)
	}

	if list, err := cli.VolumeList(ctx, volume.ListOptions{}); err == nil {
		info.Volumes = len(list.Volumes)
	}

	if list, err := cli.NetworkList(ctx, network.ListOptions{}); err == nil {
		info.Networks = len(list)
	}

	return info
}
