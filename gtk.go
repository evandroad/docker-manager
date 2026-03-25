package main

/*
#cgo linux pkg-config: gtk+-3.0
#include <gtk/gtk.h>
*/
import "C"
import "unsafe"

func maximizeWindow(window unsafe.Pointer) {
	C.gtk_window_maximize((*C.GtkWindow)(window))
}
