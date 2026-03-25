package service

import "testing"

func TestFormatVolSize(t *testing.T) {
	tests := []struct {
		input int64
		want  string
	}{
		{0, "0 B"},
		{-1, "0 B"},
		{512, "0.5 KB"},
		{1024, "1.0 KB"},
		{500 * 1024, "500.0 KB"},
		{1024 * 1024, "1.0 MB"},
		{50 * 1024 * 1024, "50.0 MB"},
		{1024 * 1024 * 1024, "1.0 GB"},
		{3.5 * 1024 * 1024 * 1024, "3.5 GB"},
	}
	for _, tt := range tests {
		got := formatVolSize(tt.input)
		if got != tt.want {
			t.Errorf("formatVolSize(%d) = %q, want %q", tt.input, got, tt.want)
		}
	}
}
