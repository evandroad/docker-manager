package service

import (
	"archive/tar"
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
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
	if err := ensureAlpine(ctx, cli); err != nil {
		return err
	}
	return runAlpineContainer(ctx, cli, "cp -a /source/. /dest/", []string{source + ":/source", dest + ":/dest"})
}

var VolumeSaveDialogFunc func(filename string) (string, bool)

func ensureAlpine(ctx context.Context, cli *client.Client) error {
	if _, _, err := cli.ImageInspectWithRaw(ctx, "alpine"); err != nil {
		r, pullErr := cli.ImagePull(ctx, "alpine", image.PullOptions{})
		if pullErr != nil {
			return fmt.Errorf("failed to pull alpine image: %w", pullErr)
		}
		io.Copy(io.Discard, r)
		r.Close()
	}
	return nil
}

func runAlpineContainer(ctx context.Context, cli *client.Client, cmd string, binds []string) error {
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: "alpine",
		Cmd:   []string{"sh", "-c", cmd},
	}, &container.HostConfig{
		Binds: binds,
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
			return fmt.Errorf("command failed with exit code %d", res.StatusCode)
		}
	case err := <-errCh:
		return err
	}
	return nil
}

func ExportVolume(name string, progress func(string)) (string, error) {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return "", err
	}
	if _, err := cli.VolumeInspect(ctx, name); err != nil {
		return "", fmt.Errorf("volume not found: %s", name)
	}
	filename := name + ".tar.gz"
	if len(name) > 20 {
		filename = name[:15] + ".tar.gz"
	}
	path, ok := VolumeSaveDialogFunc(filename)
	if !ok {
		return "", nil
	}
	if err := ensureAlpine(ctx, cli); err != nil {
		return "", err
	}
	progress("Creating archive…")
	// get volume size for progress estimation
	du, _ := cli.DiskUsage(ctx, types.DiskUsageOptions{})
	var totalSize int64
	if du.Volumes != nil {
		for _, v := range du.Volumes {
			if v.Name == name {
				totalSize = v.UsageData.Size
				break
			}
		}
	}
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: "alpine",
		Cmd:   []string{"tar", "czf", "/backup.tar.gz", "-C", "/volume", "."},
	}, &container.HostConfig{
		Binds: []string{name + ":/volume:ro"},
	}, nil, nil, "")
	if err != nil {
		return "", err
	}
	defer cli.ContainerRemove(ctx, resp.ID, container.RemoveOptions{})
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", err
	}
	SaveTask(&ActiveTask{Type: "export", VolumeName: name, ContainerID: resp.ID, SavePath: path})
	defer SaveTask(nil)
	// poll container size while running
	waitCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
	done := false
	go func() {
		for !done {
			time.Sleep(3 * time.Second)
			if done {
				return
			}
			cjson, err := cli.ContainerInspect(ctx, resp.ID)
			if err != nil {
				continue
			}
			if cjson.State != nil && !cjson.State.Running {
				return
			}
			stat, err := cli.ContainerStatPath(ctx, resp.ID, "/backup.tar.gz")
			if err == nil && totalSize > 0 {
				// estimate: compressed is ~20% of original, so scale accordingly
				pct := int(float64(stat.Size) / (float64(totalSize) * 0.2) * 100)
				if pct > 99 {
					pct = 99
				}
				progress(fmt.Sprintf("Compressing… %s (%d%%)", formatVolSize(stat.Size), pct))
			} else if err == nil {
				progress(fmt.Sprintf("Compressing… %s", formatVolSize(stat.Size)))
			}
		}
	}()
	select {
	case res := <-waitCh:
		done = true
		if res.StatusCode != 0 {
			return "", fmt.Errorf("tar failed with exit code %d", res.StatusCode)
		}
	case e := <-errCh:
		done = true
		return "", e
	}
	stat, _ := cli.ContainerStatPath(ctx, resp.ID, "/backup.tar.gz")
	totalStr := ""
	if stat.Size > 0 {
		totalStr = formatVolSize(stat.Size)
	}
	progress("Downloading archive…")
	reader, _, err := cli.CopyFromContainer(ctx, resp.ID, "/backup.tar.gz")
	if err != nil {
		return "", err
	}
	defer reader.Close()
	f, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	tr := tar.NewReader(reader)
	if _, err := tr.Next(); err != nil {
		return "", err
	}
	buf := make([]byte, 256*1024)
	var written int64
	lastReport := time.Now()
	for {
		n, readErr := tr.Read(buf)
		if n > 0 {
			f.Write(buf[:n])
			written += int64(n)
			if time.Since(lastReport) > 3*time.Second {
				if totalStr != "" {
					progress(fmt.Sprintf("Downloading… %s / %s", formatVolSize(written), totalStr))
				} else {
					progress(fmt.Sprintf("Downloading… %s", formatVolSize(written)))
				}
				lastReport = time.Now()
			}
		}
		if readErr != nil {
			break
		}
	}
	return path, nil
}

func ImportVolume(name string, progress func(string)) error {
	ctx := context.Background()
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return err
	}
	if _, err := cli.VolumeInspect(ctx, name); err != nil {
		return fmt.Errorf("volume not found: %s", name)
	}
	path, ok := VolumeOpenTarDialogFunc()
	if !ok {
		return nil
	}
	if err := ensureAlpine(ctx, cli); err != nil {
		return err
	}
	resp, err := cli.ContainerCreate(ctx, &container.Config{
		Image: "alpine",
		Cmd:   []string{"tar", "xzf", "/backup.tar.gz", "-C", "/volume"},
	}, &container.HostConfig{
		Binds: []string{name + ":/volume"},
	}, nil, nil, "")
	if err != nil {
		return err
	}
	defer cli.ContainerRemove(ctx, resp.ID, container.RemoveOptions{})
	progress("Uploading archive…")
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	fi, _ := f.Stat()
	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)
	tw.WriteHeader(&tar.Header{Name: "backup.tar.gz", Size: fi.Size(), Mode: 0644})
	io.Copy(tw, f)
	tw.Close()
	if err := cli.CopyToContainer(ctx, resp.ID, "/", &buf, container.CopyToContainerOptions{}); err != nil {
		return err
	}
	progress("Extracting…")
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return err
	}
	SaveTask(&ActiveTask{Type: "import", VolumeName: name, ContainerID: resp.ID})
	defer SaveTask(nil)
	waitCh, errCh := cli.ContainerWait(ctx, resp.ID, container.WaitConditionNotRunning)
	select {
	case res := <-waitCh:
		if res.StatusCode != 0 {
			return fmt.Errorf("tar extract failed with exit code %d", res.StatusCode)
		}
	case e := <-errCh:
		return e
	}
	return nil
}

var VolumeOpenTarDialogFunc func() (string, bool)
