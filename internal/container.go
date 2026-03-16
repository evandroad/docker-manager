package internal

import (
	"context"
	"os/exec"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

type ContainerInfo struct {
	ID     string
	Name   string
	Image  string
	Status string
	State  string
	Project string
	Service string
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
			ID:     c.ID[:12],
			Name:   c.Names[0],
			Image:  c.Image,
			Status: c.Status,
			State:  c.State,
			Project: c.Labels["com.docker.compose.project"],
			Service: c.Labels["com.docker.compose.service"],
		})
	}

	return out
}

func StartContainer(id string) string {
	ctx := context.Background()

	cli, err := client.NewClientWithOpts(
		client.FromEnv,
		client.WithAPIVersionNegotiation(),
	)

	if err != nil {
		return err.Error()
	}

	err = cli.ContainerStart(ctx, id, container.StartOptions{})
	if err != nil {
		return err.Error()
	}

	return "ok"
}

func RemoveContainer(id string) string {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err.Error()
	}
	err = cli.ContainerRemove(ctx, id, container.RemoveOptions{Force: true})
	if err != nil {
		return err.Error()
	}
	return "ok"
}

func StopContainer(id string) string {
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

	return "ok"
}

func RestartContainer(id string) string {
	go func() {
		ctx := context.Background()
		cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
		if err != nil {
			return
		}
		timeout := 2
		cli.ContainerRestart(ctx, id, container.StopOptions{Timeout: &timeout})
	}()
	return "ok"
}

func ComposeStart(project string) string {
	go exec.Command("docker", "compose", "-p", project, "start").Run()
	return "ok"
}

func ComposeStop(project string) string {
	go exec.Command("docker", "compose", "-p", project, "stop").Run()
	return "ok"
}
