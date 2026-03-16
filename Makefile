.PHONY: build frontend go deb version

VERSION := $(shell git describe --tags --always)

build: version frontend go

version:
	sed -i 's/^Version:.*/Version: $(VERSION)/' deb-pkg/DEBIAN/control

frontend:
	cd frontend && bun run build

go:
	go build -ldflags="-s -w" -o docker-manager .
	cp docker-manager deb-pkg/usr/local/bin/

deb: build
	dpkg-deb --build deb-pkg docker-manager_$(VERSION)_amd64.deb
