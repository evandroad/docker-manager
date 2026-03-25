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

static char* run_open_dialog() {
	GtkWidget *dialog = gtk_file_chooser_dialog_new(
		"Open file",
		NULL,
		GTK_FILE_CHOOSER_ACTION_OPEN,
		"Cancel", GTK_RESPONSE_CANCEL,
		"Open", GTK_RESPONSE_ACCEPT,
		NULL);

	GtkFileFilter *filter = gtk_file_filter_new();
	gtk_file_filter_set_name(filter, "YAML files");
	gtk_file_filter_add_pattern(filter, "*.yml");
	gtk_file_filter_add_pattern(filter, "*.yaml");
	gtk_file_chooser_add_filter(GTK_FILE_CHOOSER(dialog), filter);

	GtkFileFilter *all = gtk_file_filter_new();
	gtk_file_filter_set_name(all, "All files");
	gtk_file_filter_add_pattern(all, "*");
	gtk_file_chooser_add_filter(GTK_FILE_CHOOSER(dialog), all);

	char *result = NULL;
	if (gtk_dialog_run(GTK_DIALOG(dialog)) == GTK_RESPONSE_ACCEPT) {
		result = gtk_file_chooser_get_filename(GTK_FILE_CHOOSER(dialog));
	}
	gtk_widget_destroy(dialog);
	while (gtk_events_pending()) gtk_main_iteration();
	return result;
}

static char* run_open_tar_dialog() {
	GtkWidget *dialog = gtk_file_chooser_dialog_new(
		"Import image",
		NULL,
		GTK_FILE_CHOOSER_ACTION_OPEN,
		"Cancel", GTK_RESPONSE_CANCEL,
		"Open", GTK_RESPONSE_ACCEPT,
		NULL);

	GtkFileFilter *filter = gtk_file_filter_new();
	gtk_file_filter_set_name(filter, "Tar files");
	gtk_file_filter_add_pattern(filter, "*.tar");
	gtk_file_filter_add_pattern(filter, "*.tar.gz");
	gtk_file_chooser_add_filter(GTK_FILE_CHOOSER(dialog), filter);

	GtkFileFilter *all = gtk_file_filter_new();
	gtk_file_filter_set_name(all, "All files");
	gtk_file_filter_add_pattern(all, "*");
	gtk_file_chooser_add_filter(GTK_FILE_CHOOSER(dialog), all);

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

// saveFileDialog opens a native GTK save dialog and returns the chosen path.
func saveFileDialog(filename string) (string, bool) {
	cname := C.CString(filename)
	defer C.free(unsafe.Pointer(cname))

	done := make(chan *C.char, 1)
	gtkDo(func() {
		done <- C.run_save_dialog(cname)
	})
	cpath := <-done

	if cpath == nil {
		return "", false
	}
	path := C.GoString(cpath)
	C.g_free(C.gpointer(unsafe.Pointer(cpath)))
	return path, true
}

// openFileDialog opens a native GTK open dialog filtered to YAML files.
func openFileDialog() (string, bool) {
	done := make(chan *C.char, 1)
	gtkDo(func() {
		done <- C.run_open_dialog()
	})
	cpath := <-done

	if cpath == nil {
		return "", false
	}
	path := C.GoString(cpath)
	C.g_free(C.gpointer(unsafe.Pointer(cpath)))
	return path, true
}

// openTarDialog opens a native GTK open dialog filtered to tar files.
func openTarDialog() (string, bool) {
	done := make(chan *C.char, 1)
	gtkDo(func() {
		done <- C.run_open_tar_dialog()
	})
	cpath := <-done

	if cpath == nil {
		return "", false
	}
	path := C.GoString(cpath)
	C.g_free(C.gpointer(unsafe.Pointer(cpath)))
	return path, true
}
