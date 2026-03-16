package internal

import (
	"context"
	"fmt"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
)

type VolumeInfo struct {
	Name       string
	Driver     string
	Mountpoint string
	Size       string
	UsedBy     []string
}

func Volumes() []VolumeInfo {
	ctx := context.Background()
	var out []VolumeInfo

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return out
	}

	list, err := cli.VolumeList(ctx, volume.ListOptions{})
	if err != nil {
		return out
	}

	du, _ := cli.DiskUsage(ctx, types.DiskUsageOptions{})
	volSizes := map[string]int64{}
	if du.Volumes != nil {
		for _, v := range du.Volumes {
			volSizes[v.Name] = v.UsageData.Size
		}
	}

	containers, _ := cli.ContainerList(ctx, container.ListOptions{All: true})
	volContainers := map[string][]string{}
	for _, c := range containers {
		for _, m := range c.Mounts {
			if m.Type == "volume" {
				volContainers[m.Name] = append(volContainers[m.Name], c.Names[0])
			}
		}
	}

	for _, v := range list.Volumes {
		out = append(out, VolumeInfo{
			Name:       v.Name,
			Driver:     v.Driver,
			Mountpoint: v.Mountpoint,
			Size:       formatVolSize(volSizes[v.Name]),
			UsedBy:     volContainers[v.Name],
		})
	}

	return out
}

func formatVolSize(bytes int64) string {
	if bytes <= 0 {
		return "0 B"
	}
	mb := float64(bytes) / 1024 / 1024
	if mb >= 1024 {
		return fmt.Sprintf("%.1f GB", mb/1024)
	}
	if mb >= 1 {
		return fmt.Sprintf("%.1f MB", mb)
	}
	return fmt.Sprintf("%.1f KB", float64(bytes)/1024)
}

func RemoveVolume(name string) string {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err.Error()
	}
	if err = cli.VolumeRemove(ctx, name, true); err != nil {
		return err.Error()
	}
	return "ok"
}
