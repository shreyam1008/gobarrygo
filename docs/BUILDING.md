# Building

## Toolchain

- Go `1.26.0`
- Bun `1.3.10`
- Wails CLI `v3.0.0-alpha.74`

Install the Wails CLI:

```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-alpha.74
```

## Common Setup

```bash
cd frontend
bun install
cd ..
go run ./tools/generate_appicon.go
wails3 generate icons -input build/appicon.png -macfilename build/darwin/icons.icns -windowsfilename build/windows/icon.ico
wails3 generate bindings -clean=true -ts
```

## Linux

Install native GUI prerequisites:

```bash
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libsoup-3.0-dev pkg-config
```

Build:

```bash
task linux:build
```

Package:

```bash
task linux:package
```

Outputs:

- `bin/gobarrygo`
- `bin/*.AppImage`
- `bin/*.deb`
- `bin/*.rpm`

## Windows

Build:

```bash
task windows:build
```

Package:

```bash
task windows:package
```

Output:

- `bin/gobarrygo.exe`
- `bin/gobarrygo-amd64-installer.exe`

## macOS

Build:

```bash
task darwin:build
```

Package:

```bash
task darwin:package
```

Output:

- `bin/gobarrygo`
- `bin/gobarrygo.app`

## Validation

Run all portable checks:

```bash
task lint
task test
```

