package handlers

import (
	"docker-manager/internal/respond"
	"docker-manager/internal/service"
	"fmt"
	"net/http"
)

func VolumesList(w http.ResponseWriter, r *http.Request) {
	respond.JSON(w, http.StatusOK, service.Volumes())
}

func VolumeRemove(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	respond.Result(w, service.RemoveVolume(name))
}

func VolumeCreate(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	respond.Result(w, service.CreateVolume(name))
}

func VolumeCopy(w http.ResponseWriter, r *http.Request) {
	source := r.PathValue("source")
	dest := r.PathValue("dest")
	overwrite := r.PathValue("overwrite") == "1"
	respond.Result(w, service.CopyVolume(source, dest, overwrite))
}

func sseProgress(w http.ResponseWriter) func(string) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	flusher, _ := w.(http.Flusher)
	return func(msg string) {
		fmt.Fprintf(w, "data: %s\n\n", msg)
		if flusher != nil {
			flusher.Flush()
		}
	}
}

func VolumeExport(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	progress := sseProgress(w)
	path, err := service.ExportVolume(name, progress)
	if err != nil {
		progress("ERROR:" + err.Error())
		return
	}
	if path == "" {
		progress("CANCELLED")
		return
	}
	progress("DONE:" + path)
}

func VolumeImport(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	progress := sseProgress(w)
	err := service.ImportVolume(name, progress)
	if err != nil {
		progress("ERROR:" + err.Error())
		return
	}
	progress("DONE")
}

func VolumeTaskStatus(w http.ResponseWriter, r *http.Request) {
	task := service.LoadTask()
	if task == nil {
		respond.JSON(w, http.StatusOK, respond.H{"active": false})
		return
	}
	respond.JSON(w, http.StatusOK, respond.H{"active": true, "type": task.Type, "volume": task.VolumeName})
}

func VolumeTaskResume(w http.ResponseWriter, r *http.Request) {
	task := service.LoadTask()
	if task == nil {
		respond.JSON(w, http.StatusOK, respond.H{"active": false})
		return
	}
	progress := sseProgress(w)
	progress("Resuming…")
	err := service.CompleteExportTask(task, progress)
	if err != nil {
		progress("ERROR:" + err.Error())
		return
	}
	progress("DONE")
}

func VolumeTaskCancel(w http.ResponseWriter, r *http.Request) {
	respond.Result(w, service.CancelTask())
}
