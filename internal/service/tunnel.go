package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/docker/docker/client"
)

type HostConfig struct {
	Name    string `json:"name"`
	SSHAddr string `json:"ssh_addr"` // e.g. root@1.1.1.1
	SSHPort string `json:"ssh_port"` // e.g. 22
}

var (
	activeHost string
	tunnelCmd  *exec.Cmd
	tunnelMu   sync.Mutex
)

func configPath() string {
	dir, _ := os.UserConfigDir()
	return filepath.Join(dir, "docker-manager", "hosts.json")
}

func LoadHosts() []HostConfig {
	data, err := os.ReadFile(configPath())
	if err != nil {
		return nil
	}
	var hosts []HostConfig
	json.Unmarshal(data, &hosts)
	return hosts
}

func SaveHosts(hosts []HostConfig) error {
	p := configPath()
	os.MkdirAll(filepath.Dir(p), 0755)
	data, _ := json.MarshalIndent(hosts, "", "  ")
	return os.WriteFile(p, data, 0644)
}

func ActiveHost() string {
	tunnelMu.Lock()
	defer tunnelMu.Unlock()
	return activeHost
}

func killTunnel() {
	if tunnelCmd != nil && tunnelCmd.Process != nil {
		tunnelCmd.Process.Kill()
		tunnelCmd.Wait()
		tunnelCmd = nil
	}
}

func ConnectHost(name, password string) error {
	tunnelMu.Lock()
	defer tunnelMu.Unlock()

	killTunnel()

	if name == "" || name == "local" {
		activeHost = ""
		os.Unsetenv("DOCKER_HOST")
		return nil
	}

	hosts := LoadHosts()
	var host *HostConfig
	for i := range hosts {
		if hosts[i].Name == name {
			host = &hosts[i]
			break
		}
	}
	if host == nil {
		return fmt.Errorf("host %q not found", name)
	}

	sock := fmt.Sprintf("/tmp/docker-manager-%s.sock", name)
	os.Remove(sock)

	sshArgs := []string{"-nNT",
		"-o", "StrictHostKeyChecking=no",
		"-o", "ExitOnForwardFailure=yes",
		"-o", "ConnectTimeout=5",
		"-L", sock + ":/var/run/docker.sock",
		"-p", host.SSHPort,
		host.SSHAddr,
	}

	var cmd *exec.Cmd
	if password != "" {
		cmd = exec.Command("sshpass", append([]string{"-p", password, "ssh"}, sshArgs...)...)
	} else {
		sshArgs = append([]string{"-o", "BatchMode=yes"}, sshArgs[1:]...)
		sshArgs = append([]string{"-nNT"}, sshArgs...)
		cmd = exec.Command("ssh", sshArgs...)
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start SSH: %w", err)
	}

	// wait for socket to appear (max 6s)
	ok := false
	for i := 0; i < 60; i++ {
		// check if ssh already exited (wrong password, etc)
		if cmd.ProcessState != nil {
			break
		}
		if conn, err := net.DialTimeout("unix", sock, 200*time.Millisecond); err == nil {
			conn.Close()
			ok = true
			break
		}
		time.Sleep(100 * time.Millisecond)
	}

	if !ok {
		cmd.Process.Kill()
		cmd.Wait()
		return fmt.Errorf("SSH tunnel failed — check SSH key auth for %s -p %s", host.SSHAddr, host.SSHPort)
	}

	// verify docker is reachable
	os.Setenv("DOCKER_HOST", "unix://"+sock)
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err == nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		_, err = cli.Ping(ctx)
		cancel()
		cli.Close()
	}
	if err != nil {
		os.Unsetenv("DOCKER_HOST")
		cmd.Process.Kill()
		cmd.Wait()
		return fmt.Errorf("tunnel open but Docker unreachable: %w", err)
	}

	tunnelCmd = cmd
	activeHost = name
	return nil
}

func DisconnectTunnel() {
	tunnelMu.Lock()
	defer tunnelMu.Unlock()
	killTunnel()
	activeHost = ""
	os.Unsetenv("DOCKER_HOST")
}
