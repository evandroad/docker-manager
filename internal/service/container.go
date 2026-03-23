package service

import (
	"context"
	"os/exec"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

type ContainerInfo struct {
	ID      string
	Name    string
	Image   string
	Status  string
	State   string
	Project string
	Service string
	Created int64
}

func Containers() []ContainerInfo {
	ctx := context.Background()

	var out []ContainerInfo

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return out
	}

	list, err := cli.ContainerList(ctx, container.ListOptions{All: true})
	if err != nil {
		return out
	}

	for _, c := range list {
		out = append(out, ContainerInfo{
			ID:      c.ID[:12],
			Name:    c.Names[0],
			Image:   c.Image,
			Status:  c.Status,
			State:   c.State,
			Project: c.Labels["com.docker.compose.project"],
			Service: c.Labels["com.docker.compose.service"],
			Created: c.Created,
		})
	}

	return out
}

func StartContainer(id string) error {
	ctx := context.Background()

	cli, err := client.NewClientWithOpts(
		client.FromEnv,
		client.WithAPIVersionNegotiation(),
	)

	if err != nil {
		return err
	}

	return cli.ContainerStart(ctx, id, container.StartOptions{})
}

func RemoveContainer(id string) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	return cli.ContainerRemove(ctx, id, container.RemoveOptions{Force: true})
}

func StopContainer(id string) {
	go func() {
		ctx := context.Background()

		cli, err := client.NewClientWithOpts(
			client.FromEnv,
			client.WithAPIVersionNegotiation(),
		)

		if err != nil {
			return
		}

		timeout := 2 // segundos

		cli.ContainerStop(ctx, id, container.StopOptions{
			Timeout: &timeout,
		})
	}()
}

func RestartContainer(id string) {
	go func() {
		ctx := context.Background()
		cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
		if err != nil {
			return
		}
		timeout := 2
		cli.ContainerRestart(ctx, id, container.StopOptions{Timeout: &timeout})
	}()
}

func RenameContainer(id, newName string) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	return cli.ContainerRename(ctx, id, newName)
}

func ComposeStart(project string) {
	go exec.Command("docker", "compose", "-p", project, "start").Run()
}

func ComposeStop(project string) {
	go exec.Command("docker", "compose", "-p", project, "stop").Run()
}

func ComposeDown(project string) {
	go exec.Command("docker", "compose", "-p", project, "down").Run()
}
