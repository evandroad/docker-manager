package service

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/volume"
	"github.com/docker/docker/client"
)

type VolumeInfo struct {
	Name       string
	Driver     string
	Mountpoint string
	Size       string
	Created    int64
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
		created := int64(0)
		if t, err := time.Parse(time.RFC3339, v.CreatedAt); err == nil {
			created = t.Unix()
		}
		out = append(out, VolumeInfo{
			Name:       v.Name,
			Driver:     v.Driver,
			Mountpoint: v.Mountpoint,
			Size:       formatVolSize(volSizes[v.Name]),
			Created:    created,
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

func RemoveVolume(name string) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	return cli.VolumeRemove(ctx, name, true)
}

func CreateVolume(name string) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	_, err = cli.VolumeCreate(ctx, volume.CreateOptions{Name: name})
	return err
}

func CopyVolume(source, dest string, overwrite bool) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	// validate source exists
	if _, err := cli.VolumeInspect(ctx, source); err != nil {
		return fmt.Errorf("source volume not found: %s", source)
	}
	if overwrite {
		// validate dest exists
		if _, err := cli.VolumeInspect(ctx, dest); err != nil {
			return fmt.Errorf("destination volume not found: %s", dest)
		}
	} else {
		// validate dest does not exist
		if _, err := cli.VolumeInspect(ctx, dest); err == nil {
			return fmt.Errorf("destination volume already exists: %s", dest)
		}
		if _, err := cli.VolumeCreate(ctx, volume.CreateOptions{Name: dest}); err != nil {
			return err
		}
	}
	// ensure alpine image is available
	if _, _, err := cli.ImageInspectWithRaw(ctx, "alpine"); err != nil {
		r, pullErr := cli.ImagePull(ctx, "alpine", image.PullOptions{})
		if pullErr != nil {
			return fmt.Errorf("failed to pull alpine image: %w", pullErr)
		}
		io.Copy(io.Discard, r)
		r.Close()
	}
	// run alpine container to copy data
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: "alpine",
		Cmd:   []string{"sh", "-c", "cp -a /source/. /dest/"},
	}, &container.HostConfig{
		Binds: []string{source + ":/source", dest + ":/dest"},
	}, nil, nil, "")
	if err != nil {
		return err
	}
	defer cli.ContainerRemove(ctx, resp.ID, container.RemoveOptions{})
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return err
	}
	waitCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
	select {
	case res := <-waitCh:
		if res.StatusCode != 0 {
			return fmt.Errorf("copy failed with exit code %d", res.StatusCode)
		}
	case err := <-errCh:
		return err
	}
	return nil
}
