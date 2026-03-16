package internal

import (
	"context"

	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
)

type NetworkInfo struct {
	ID     string
	Name   string
	Driver string
	Scope  string
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
		})
	}

	return out
}
