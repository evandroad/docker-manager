package service

import (
	"context"
	"os/exec"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
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

	// Build imageID -> tag map for resolving sha256 references
	var idToTag map[string]string
	imgs, imgErr := cli.ImageList(ctx, image.ListOptions{})
	if imgErr == nil {
		idToTag = make(map[string]string, len(imgs))
		for _, img := range imgs {
			if len(img.RepoTags) > 0 {
				idToTag[img.ID] = img.RepoTags[0]
			}
		}
	}

	for _, c := range list {
		img := c.Image
		if idToTag != nil && strings.HasPrefix(img, "sha256:") {
			if tag, ok := idToTag[c.ImageID]; ok {
				img = tag
			}
		}
		out = append(out, ContainerInfo{
			ID:      c.ID[:12],
			Name:    c.Names[0],
			Image:   img,
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

type ContainerDetail struct {
	Ports  []string          `json:"ports"`
	Env    []string          `json:"env"`
	Mounts []MountInfo       `json:"mounts"`
	Nets   []string          `json:"nets"`
	Labels map[string]string `json:"labels"`
}

type MountInfo struct {
	Type   string `json:"type"`
	Source string `json:"source"`
	Dest   string `json:"dest"`
}

func InspectContainer(id string) (*ContainerDetail, error) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	info, err := cli.ContainerInspect(ctx, id)
	if err != nil {
		return nil, err
	}
	d := &ContainerDetail{
		Env:    info.Config.Env,
		Labels: info.Config.Labels,
	}
	for p, bindings := range info.NetworkSettings.Ports {
		for _, b := range bindings {
			d.Ports = append(d.Ports, b.HostIP+":"+b.HostPort+"→"+string(p))
		}
		if len(bindings) == 0 {
			d.Ports = append(d.Ports, string(p))
		}
	}
	for _, m := range info.Mounts {
		d.Mounts = append(d.Mounts, MountInfo{Type: string(m.Type), Source: m.Source, Dest: m.Destination})
	}
	for name := range info.NetworkSettings.Networks {
		d.Nets = append(d.Nets, name)
	}
	return d, nil
}
