# Releasing

## Versioning

- Current line: `0.0.5`
- Current codename: `BHOODEVI`

The version string is kept in:

- `internal/version/version.go`
- `build/config.yml`
- `CHANGELOG.md`
- `README.md`

## Release Flow

1. Update the version metadata and changelog.
2. Commit the release preparation changes.
3. Tag the release with a semantic version, for example:

```bash
git tag v0.0.5
git push origin main --tags
```

4. GitHub Actions will:
   - run validation
   - build Linux, Windows, and macOS artifacts
   - publish the resulting files to a GitHub Release
   - attach a `checksums.txt` manifest

## Main Branch Builds

Every push to `main` triggers the `build-main.yml` workflow. It uploads unsigned build artifacts so packaging regressions are visible before a release tag is cut.

## Signing

The current repository automation produces unsigned public artifacts by default.

- Linux packages are created unsigned.
- Windows NSIS installers are unsigned.
- macOS `.app` bundles are ad-hoc signed when built on macOS runners.

Introduce platform certificates later without changing the application architecture.

