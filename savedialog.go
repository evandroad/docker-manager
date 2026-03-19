package main

/*
#cgo linux pkg-config: gtk+-3.0
#include <gtk/gtk.h>
#include <stdlib.h>

static char* run_save_dialog(const char* filename) {
	GtkWidget *dialog = gtk_file_chooser_dialog_new(
		"Salvar logs",
		NULL,
		GTK_FILE_CHOOSER_ACTION_SAVE,
		"Cancelar", GTK_RESPONSE_CANCEL,
		"Salvar", GTK_RESPONSE_ACCEPT,
		NULL);
	gtk_file_chooser_set_do_overwrite_confirmation(GTK_FILE_CHOOSER(dialog), TRUE);
	gtk_file_chooser_set_current_name(GTK_FILE_CHOOSER(dialog), filename);

	char *result = NULL;
	if (gtk_dialog_run(GTK_DIALOG(dialog)) == GTK_RESPONSE_ACCEPT) {
		result = gtk_file_chooser_get_filename(GTK_FILE_CHOOSER(dialog));
	}
	gtk_widget_destroy(dialog);
	while (gtk_events_pending()) gtk_main_iteration();
	return result;
}

extern void goGtkCallback(int id);

static gboolean _go_gtk_callback(gpointer data) {
	goGtkCallback(GPOINTER_TO_INT(data));
	return FALSE;
}

static void idle_add(int id) {
	g_idle_add(_go_gtk_callback, GINT_TO_POINTER(id));
}
*/
import "C"

import (
	"encoding/json"
	"net/http"
	"os"
	"sync"
	"unsafe"
)

var (
	gtkCallbacks   = map[int]func(){}
	gtkCallbacksMu sync.Mutex
	gtkCallbackID  int
)

func gtkDo(fn func()) {
	gtkCallbacksMu.Lock()
	gtkCallbackID++
	id := gtkCallbackID
	gtkCallbacks[id] = fn
	gtkCallbacksMu.Unlock()
	C.idle_add(C.int(id))
}

//export goGtkCallback
func goGtkCallback(id C.int) {
	gtkCallbacksMu.Lock()
	fn := gtkCallbacks[int(id)]
	delete(gtkCallbacks, int(id))
	gtkCallbacksMu.Unlock()
	if fn != nil {
		fn()
	}
}

func saveFileHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Filename string `json:"filename"`
		Content  string `json:"content"`
	}
	if json.NewDecoder(r.Body).Decode(&req) != nil || req.Content == "" {
		http.Error(w, "bad request", 400)
		return
	}
	if req.Filename == "" {
		req.Filename = "logs.log"
	}

	cname := C.CString(req.Filename)
	defer C.free(unsafe.Pointer(cname))

	done := make(chan *C.char, 1)
	gtkDo(func() {
		done <- C.run_save_dialog(cname)
	})
	cpath := <-done

	if cpath == nil {
		json.NewEncoder(w).Encode(map[string]string{"status": "cancelled"})
		return
	}
	path := C.GoString(cpath)
	C.g_free(C.gpointer(unsafe.Pointer(cpath)))

	if err := os.WriteFile(path, []byte(req.Content), 0644); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "path": path})
}
