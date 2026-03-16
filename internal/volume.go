package internal

import (
	"context"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
)

type VolumeInfo struct {
	Name       string
	Driver     string
	Mountpoint string
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
			UsedBy:     volContainers[v.Name],
		})
	}

	return out
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
