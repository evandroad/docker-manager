package main

import (
	"os/exec"
	"strings"
)

func saveFileDialog(filename string) (string, bool) {
	cmd := exec.Command("zenity", "--file-selection", "--save", "--confirm-overwrite", "--filename="+filename)
	out, err := cmd.Output()
	if err != nil {
		return "", false
	}
	return strings.TrimSpace(string(out)), true
}

func openFileDialog() (string, bool) {
	cmd := exec.Command("zenity", "--file-selection", "--file-filter=YAML files | *.yml *.yaml", "--file-filter=All files | *")
	out, err := cmd.Output()
	if err != nil {
		return "", false
	}
	return strings.TrimSpace(string(out)), true
}

func openTarDialog() (string, bool) {
	cmd := exec.Command("zenity", "--file-selection", "--file-filter=Tar files | *.tar *.tar.gz", "--file-filter=All files | *")
	out, err := cmd.Output()
	if err != nil {
		return "", false
	}
	return strings.TrimSpace(string(out)), true
}
