package service

import "testing"

func TestFormatSize(t *testing.T) {
	tests := []struct {
		input int64
		want  string
	}{
		{0, "0.0 MB"},
		{1024 * 1024, "1.0 MB"},
		{500 * 1024 * 1024, "500.0 MB"},
		{1024 * 1024 * 1024, "1.0 GB"},
		{2.5 * 1024 * 1024 * 1024, "2.5 GB"},
	}
	for _, tt := range tests {
		got := formatSize(tt.input)
		if got != tt.want {
			t.Errorf("formatSize(%d) = %q, want %q", tt.input, got, tt.want)
		}
	}
}
