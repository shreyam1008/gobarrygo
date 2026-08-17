# Install, uninstall, and rollback

GoBarryGo currently publishes amd64 artifacts. The shell installer rejects arm64 instead of silently installing an incompatible binary. Install `aria2c` separately before launching GoBarryGo.

## Latest release

```bash
curl -fsSL https://raw.githubusercontent.com/shreyam1008/gobarrygo/main/install.sh | bash
```

The installer downloads the release `checksums.txt` and fails closed if the selected artifact's SHA-256 digest does not match. Windows Git Bash runs the NSIS installer as an installer; it does not copy that installer as if it were the application binary.

## Pinned release

```bash
curl -fsSL https://raw.githubusercontent.com/shreyam1008/gobarrygo/main/install.sh -o /tmp/gobarrygo-install.sh
GOBARRYGO_VERSION=v0.0.9 bash /tmp/gobarrygo-install.sh
```

Review the downloaded script before running it when your environment requires a stricter trust policy.

## Uninstall

- Linux AppImage: remove the installed `gobarrygo` file from `/usr/local/bin` or `~/.local/bin`.
- macOS: remove `GoBarryGo.app` from `/Applications`.
- Windows: use **Settings → Apps → Installed apps → GoBarryGo → Uninstall** so NSIS removes its files and shortcuts.

Removing the application does not remove the external `aria2c` package or unrelated downloads.

## Roll back

Uninstall the current application, then run the pinned-release command with the previous known-good tag. Verify the selected tag and its checksums at the public GitHub release page before installation. The website-domain rollback procedure is separate and documented in [domain-release.md](domain-release.md).
