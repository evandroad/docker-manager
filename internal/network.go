package internal

import (
	"context"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
)

type NetworkInfo struct {
	ID     string
	Name   string
	Driver string
	Scope  string
	UsedBy []string
}

func Networks() []NetworkInfo {
	ctx := context.Background()
	var out []NetworkInfo

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return out
	}

	list, err := cli.NetworkList(ctx, network.ListOptions{})
	if err != nil {
		return out
	}

	containers, _ := cli.ContainerList(ctx, container.ListOptions{All: true})
	netContainers := map[string][]string{}
	for _, c := range containers {
		if c.NetworkSettings != nil {
			for netName := range c.NetworkSettings.Networks {
				netContainers[netName] = append(netContainers[netName], c.Names[0])
			}
		}
	}

	for _, n := range list {
		id := n.ID
		if len(id) > 12 {
			id = id[:12]
		}
		out = append(out, NetworkInfo{
			ID:     id,
			Name:   n.Name,
			Driver: n.Driver,
			Scope:  n.Scope,
			UsedBy: netContainers[n.Name],
		})
	}

	return out
}

func RemoveNetwork(id string) string {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err.Error()
	}
	if err = cli.NetworkRemove(ctx, id); err != nil {
		return err.Error()
	}
	return "ok"
}
