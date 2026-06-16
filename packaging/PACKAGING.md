# GoBarryGo — Packaging Guide

Publisher: Shreyam Adhikari (shreyam1008@gmail.com)
Version: 0.0.9

---

## Files in this directory

| Path | Purpose |
| --- | --- |
| `../build/linux/io.github.shreyam1008.GoBarryGo.metainfo.xml` | AppStream metadata |
| `../build/linux/io.github.shreyam1008.GoBarryGo.flatpak.yml` | Flatpak manifest for Flathub |
| `../snap/snapcraft.yaml` | Snap Store packaging |
| `winget/manifests/s/ShreyamAdhikari/GoBarryGo/0.0.9/` | WinGet manifests |

---

## Step 0: Prepare release artifacts

Before submitting to any store, create a GitHub Release tag `v0.0.9` with:

```
gobarrygo-amd64-installer.exe    (Windows NSIS installer from Wails build)
gobarrygo-linux-amd64            (Linux binary or AppImage)
```

The Wails build pipeline (`wails3 build`) produces the Windows installer via NSIS.

---

## 1. Snap Store (Linux — faster path than Flathub)

GoBarryGo uses Wails v3 + WebKitGTK. Snap supports this well via the gnome extension.

### Key decision: aria2c inside or outside the snap

GoBarryGo controls `aria2c` via JSON-RPC. Under strict confinement, the snap cannot
reach host binaries. Easiest solution: bundle aria2c as a stage-package.

In `snap/snapcraft.yaml`, add `aria2` to `stage-packages` under the `gobarrygo` part:

```yaml
    stage-packages:
      - libgtk-3-0t64
      - libwebkit2gtk-4.1-0
      - aria2        # <-- add this
```

Then update the app to launch the bundled `$SNAP/usr/bin/aria2c` instead of relying
on the host PATH.

### Build

```bash
sudo snap install snapcraft --classic
cd /home/shre/Desktop/me/gobarrygo
snapcraft
# Produces: gobarrygo_0.0.9_amd64.snap
```

### Register and upload

```bash
snapcraft login
snapcraft register gobarrygo
snapcraft upload gobarrygo_0.0.9_amd64.snap --release=stable
```

---

## 2. Flathub

GoBarryGo uses Wails v3 which embeds a WebView frontend. The GNOME runtime includes
WebKitGTK, making it the right base runtime.

### Change runtime in flatpak manifest

Edit `build/linux/io.github.shreyam1008.GoBarryGo.flatpak.yml`:

```yaml
runtime: org.gnome.Platform
runtime-version: "48"
sdk: org.gnome.Sdk
```

Remove the stub `webkit2gtk` module — the GNOME runtime already provides it.

### aria2c inside Flatpak

Use `flatpak-spawn --host aria2c ...` to invoke the host aria2c from inside the sandbox.
In GoBarryGo's Go code, detect if running inside Flatpak:

```go
if os.Getenv("FLATPAK_ID") != "" {
    // prefix command with: flatpak-spawn --host
}
```

### Generate Go vendor sources

```bash
python3 flatpak-go-vendor.py go.sum > build/linux/go-vendor-sources.json
# Tool: https://github.com/flatpak/flatpak-builder-tools/tree/master/go-vendor
```

### Replace placeholder commit SHA

```bash
git ls-remote https://github.com/shreyam1008/gobarrygo refs/tags/v0.0.9
# Paste SHA into flatpak manifest
```

### Test locally

```bash
flatpak install org.gnome.Platform//48 org.gnome.Sdk//48
flatpak install org.freedesktop.Sdk.Extension.golang
flatpak-builder --force-clean build-dir build/linux/io.github.shreyam1008.GoBarryGo.flatpak.yml
flatpak-builder --run build-dir build/linux/io.github.shreyam1008.GoBarryGo.flatpak.yml gobarrygo
```

### Submit to Flathub

1. Fork https://github.com/flathub/flathub
2. Create directory `io.github.shreyam1008.GoBarryGo/`
3. Add manifest, go-vendor-sources.json, icon (512x512 PNG), metainfo, desktop file
4. Submit PR — https://docs.flathub.org/docs/for-app-authors/submission

---

## 3. WinGet

### Get installer sha256

```powershell
certutil -hashfile gobarrygo-amd64-installer.exe SHA256
```

### Steps

1. Fork https://github.com/microsoft/winget-pkgs
2. Copy `packaging/winget/manifests/s/ShreyamAdhikari/GoBarryGo/0.0.9/` into your fork
3. Replace placeholder `InstallerSha256` with real sha256
4. Validate:

```powershell
winget validate manifests/s/ShreyamAdhikari/GoBarryGo/0.0.9/
```

5. Submit PR

### After approval

```powershell
winget install ShreyamAdhikari.GoBarryGo
```

---

## Release checklist

- [ ] `go test ./...` passes
- [ ] Wails build produces Windows installer and Linux binary
- [ ] GitHub Release tag created with artifacts attached
- [ ] AppStream metainfo release entry added
- [ ] Snap version bumped in `snap/snapcraft.yaml`
- [ ] Flatpak manifest commit SHA and version updated
- [ ] WinGet installer sha256 updated
- [ ] nfpm.yaml version bumped for `.deb`/`.rpm` builds
