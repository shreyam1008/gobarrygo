# GoBarryGo public retirement runbook

Status: **prepared locally; not published, redirected, or archived**.

This status line is operational evidence, not permanent prose. After each
activation or rollback, replace it with the exact resulting state and verification
date in a follow-up evidence commit.

This runbook separates the compatibility-page change from the later permanent
redirect. Merging the prepared site publishes a human-readable transition page;
it does not change DNS, GitHub Pages settings, package registries, releases, or
repository archival state.

## Invariants

- Preserve the complete repository, Git history, tags, release assets,
  checksums, screenshots, and documentation.
- Keep
  `archive/before-date-rewrite-2026-06-18` at
  `2ae2351a144cf242a0f1f93a6d10e94943403bb1`.
- Keep the verified all-refs bundle outside the repository. Its SHA-256 digest
  is `f070678a5b72d135ad8e5966f6db4678905e04c86aad5ad02ae5a2d118c9c76d`.
- Never rewrite or delete the public `v0.0.5` through `v0.0.9` releases.
- Do not reuse GoBarryGo package identifiers for ProtoPeek.
- Do not archive the repository as part of the site or redirect change.

## Compatibility-page activation gate

Activate the prepared site only after every item passes:

1. ProtoPeek `v0.5.0` is a published stable release with Downloader and the
   `migrate-gobarry` bridge.
2. The release archives, checksums, attestations, and supported clean installs
   have been verified.
3. Homebrew and Scoop install ProtoPeek `v0.5.0` with an external `aria2c`
   dependency.
4. `https://protopeek.shreyam1008.com.np/downloader/` is live with correct HTTPS,
   canonical, JSON-LD, screenshots, robots metadata, and sitemap entry.
5. Search Console has accepted the ProtoPeek sitemap and the Downloader URL has
   an indexing request or equivalent recorded evidence.
6. Every GoBarryGo `v0.0.9` asset and `checksums.txt` still returns successfully.

Then merge the retirement-page change and wait for the GoBarryGo Pages workflow.
Verify the public page title, self-canonical, parsed JSON-LD, ProtoPeek and
migration links, legacy downloads, `robots.txt`, sitemap, and responsive layout.
After those checks pass, update the status line to
`Compatibility page live; permanent redirect disabled; repository unarchived — verified YYYY-MM-DD`.

## Compatibility-page rollback

If the page is inaccurate or breaks legacy access:

1. Record the failed public checks and the last known-good Pages run.
2. Revert the single retirement-page commit on `main`.
3. Wait for the Pages workflow to deploy the prior site.
4. Verify HTTPS, the self-canonical, the v0.0.9 downloads, checksums, robots, and
   sitemap again.
5. Update the status line to
   `Compatibility page rolled back; permanent redirect disabled; repository unarchived — verified YYYY-MM-DD`.

No DNS change is needed to roll back the compatibility page.

## Permanent redirect gate

The permanent redirect is a separate later operation. Do not enable it merely
because the compatibility page is live. Require:

- the compatibility-page activation gate above;
- package and migration support evidence after release;
- Search Console evidence for the new Downloader page;
- an explicitly approved redirect change window and rollback owner.

GitHub Pages cannot emit an origin-level permanent redirect by itself. Use an
approved Cloudflare Redirect Rule (or an equivalently reviewable edge rule)
only after the gate. The rule must:

- match only `gobarrygo.shreyam1008.com.np`;
- return `301` or `308` to
  `https://protopeek.shreyam1008.com.np/downloader/`;
- preserve the query string;
- avoid redirecting any ProtoPeek hostname back to GoBarryGo;
- leave GitHub releases and repository URLs untouched.

Before activation, export or screenshot the current DNS and Pages settings.
After activation, verify HTTP and HTTPS, certificate validity, status code,
target URL, query preservation, redirect-loop absence, and several old paths.
Then update the status line to
`Permanent redirect live; repository unarchived — verified YYYY-MM-DD`.

## Permanent redirect rollback

1. Disable the exact Cloudflare redirect rule.
2. Restore the previously recorded DNS proxy mode if the rule required a change.
3. Verify that the human-readable GoBarryGo compatibility page returns HTTPS
   `200` again.
4. Record the failure and keep the repository, releases, and Pages site active.
5. Update the status line to
   `Permanent redirect rolled back; compatibility page live; repository unarchived — verified YYYY-MM-DD`.

Repository archival remains optional and must wait for at least two stable
ProtoPeek releases or a separately documented support window.
