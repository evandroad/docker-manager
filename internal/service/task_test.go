package service

import (
	"os"
	"path/filepath"
	"testing"
)

func withTempTaskFile(t *testing.T, fn func()) {
	dir := t.TempDir()
	orig := setTaskFile(filepath.Join(dir, "task.json"))
	defer setTaskFile(orig)
	fn()
}

func TestSaveAndLoadTask(t *testing.T) {
	withTempTaskFile(t, func() {
		if task := LoadTask(); task != nil {
			t.Fatal("expected nil task, got", task)
		}

		SaveTask(&ActiveTask{
			Type:        "export",
			VolumeName:  "myvolume",
			ContainerID: "abc123",
			SavePath:    "/tmp/backup.tar.gz",
		})

		task := LoadTask()
		if task == nil {
			t.Fatal("expected task, got nil")
		}
		if task.Type != "export" {
			t.Errorf("Type = %q, want %q", task.Type, "export")
		}
		if task.VolumeName != "myvolume" {
			t.Errorf("VolumeName = %q, want %q", task.VolumeName, "myvolume")
		}
		if task.ContainerID != "abc123" {
			t.Errorf("ContainerID = %q, want %q", task.ContainerID, "abc123")
		}
		if task.SavePath != "/tmp/backup.tar.gz" {
			t.Errorf("SavePath = %q, want %q", task.SavePath, "/tmp/backup.tar.gz")
		}

		SaveTask(nil)
		if task := LoadTask(); task != nil {
			t.Fatal("expected nil after clear, got", task)
		}
	})
}

func TestLoadTaskInvalidJSON(t *testing.T) {
	withTempTaskFile(t, func() {
		os.WriteFile(taskFile, []byte("not json"), 0644)
		if task := LoadTask(); task != nil {
			t.Fatal("expected nil for invalid JSON, got", task)
		}
	})
}
