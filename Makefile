.PHONY: build frontend go deb version

VERSION := $(shell git describe --tags --always)

build: version frontend go

version:
	sed -i 's/^Version:.*/Version: $(VERSION)/' deb-pkg/DEBIAN/control

frontend:
	cd frontend && bun run build

go:
	go build -ldflags="-s -w -X main.Version=$(VERSION)" -o docker-manager .
	cp docker-manager deb-pkg/usr/local/bin/

deb: build
	rm -f docker-manager*.deb
	dpkg-deb --build deb-pkg docker-manager_$(VERSION)_amd64.deb
