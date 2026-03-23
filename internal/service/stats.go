package service

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

type ContainerStats struct {
	ID  string  `json:"id"`
	CPU float64 `json:"cpu"`
	Mem string  `json:"mem"`
}

func CollectStats(ctx context.Context) []ContainerStats {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil
	}
	defer cli.Close()

	list, err := cli.ContainerList(ctx, container.ListOptions{})
	if err != nil {
		return nil
	}

	out := make([]ContainerStats, 0, len(list))
	for _, c := range list {
		resp, err := cli.ContainerStatsOneShot(ctx, c.ID)
		if err != nil {
			continue
		}
		var s struct {
			CPUStats struct {
				CPUUsage    struct{ TotalUsage uint64 `json:"total_usage"` } `json:"cpu_usage"`
				SystemUsage uint64 `json:"system_cpu_usage"`
				OnlineCPUs  int    `json:"online_cpus"`
			} `json:"cpu_stats"`
			PreCPUStats struct {
				CPUUsage    struct{ TotalUsage uint64 `json:"total_usage"` } `json:"cpu_usage"`
				SystemUsage uint64 `json:"system_cpu_usage"`
			} `json:"precpu_stats"`
			MemoryStats struct {
				Usage uint64            `json:"usage"`
				Stats map[string]uint64 `json:"stats"`
				Limit uint64            `json:"limit"`
			} `json:"memory_stats"`
		}
		json.NewDecoder(resp.Body).Decode(&s)
		resp.Body.Close()

		cpuDelta := float64(s.CPUStats.CPUUsage.TotalUsage - s.PreCPUStats.CPUUsage.TotalUsage)
		sysDelta := float64(s.CPUStats.SystemUsage - s.PreCPUStats.SystemUsage)
		cpu := 0.0
		if sysDelta > 0 && s.CPUStats.OnlineCPUs > 0 {
			cpu = (cpuDelta / sysDelta) * float64(s.CPUStats.OnlineCPUs) * 100
		}

		memUsage := s.MemoryStats.Usage
		if cache, ok := s.MemoryStats.Stats["inactive_file"]; ok {
			memUsage -= cache
		}

		out = append(out, ContainerStats{
			ID:  c.ID[:12],
			CPU: cpu,
			Mem: formatBytes(memUsage),
		})
	}
	return out
}

func formatBytes(b uint64) string {
	switch {
	case b >= 1<<30:
		return fmt.Sprintf("%.1f GB", float64(b)/(1<<30))
	case b >= 1<<20:
		return fmt.Sprintf("%.1f MB", float64(b)/(1<<20))
	default:
		return fmt.Sprintf("%.0f KB", float64(b)/(1<<10))
	}
}
