# GoBarryGo release provenance

This record preserves the distinction between the commits that GitHub Actions
actually built for the published releases and the commits to which the current
release tags resolve after the local date/history rewrite. It is evidence for
archival and migration work; it is not a request to recreate, move, or delete a
release.

Verified on 2026-08-23 after fetching `origin` from
`https://github.com/shreyam1008/gobarrygo.git`.

## Published release source

| Release | Published (UTC) | Successful release run | Actions `head_sha` actually built | Current tag commit | Shared source tree | Match |
| --- | --- | --- | --- | --- | --- | --- |
| `v0.0.5` | 2026-03-13 15:55:18 | [23058934126](https://github.com/shreyam1008/gobarrygo/actions/runs/23058934126) | `7a81a016806613da2692ef37965202ef3fc4b689` | `b93e59d8c1e61152f6f9bbc01858feb9aafec8e6` | `791e4d0ca6a0b1eec6b61ecc2643b6e7497d35b5` | identical |
| `v0.0.6` | 2026-03-13 17:05:56 | [23061722957](https://github.com/shreyam1008/gobarrygo/actions/runs/23061722957) | `ed08ecdf56eb3fc0f36f68ac7913aeb7000e2661` | `bfadb7a55aa2d88d4c34a648db94e2d8b573d0b8` | `6869869e3d559d3e9288cea04a0261bc44988873` | identical |
| `v0.0.7` | 2026-03-14 00:06:37 | [23075471689](https://github.com/shreyam1008/gobarrygo/actions/runs/23075471689) | `e862da27f41b0a811b7de42456294b37646419e3` | `12e2efae73ebb37234d656a6dd7da9a4532081d3` | `fb6a206391e08fcf2c67c31e7798f8cd80fd7476` | identical |
| `v0.0.8` | 2026-06-16 05:14:20 | [27595619290](https://github.com/shreyam1008/gobarrygo/actions/runs/27595619290) | `e0349431505f60ef68776a610c3105908c6514f4` | `685529ae2d2d9938bc47b220c24555fd0c6c70eb` | `1dea88c31ee675563cef4bc6c33c977f7c8656ec` | identical |
| `v0.0.9` | 2026-06-16 05:49:10 | [27596924181](https://github.com/shreyam1008/gobarrygo/actions/runs/27596924181) | `002326f6a4b50897c71f5e546874075f9c28963b` | `8a737d755be4d3c4bd6a3c44fc69c0eb928e45ff` | `8044b83d78d514536bc28352b4f49a478f777ff8` | identical |

The `v0.0.6` tag triggered several release runs while its build was being fixed.
Run `23061722957` is the final successful run: it started at
2026-03-13 17:01:46 UTC, ended at 17:05:59 UTC, and its release was published
at 17:05:56 UTC. Earlier `v0.0.6` runs are part of the Actions history, but are
not the final published-source row above.

The current remote tag refs were also checked directly with `git ls-remote`.
`v0.0.5` through `v0.0.7` are lightweight tags. `v0.0.8` and `v0.0.9` are
annotated tags with these remote tag-object and peeled-commit pairs:

| Tag | Tag object | Peeled commit |
| --- | --- | --- |
| `v0.0.8` | `f86eaa539cd009966554aad53930432fe9fc611d` | `685529ae2d2d9938bc47b220c24555fd0c6c70eb` |
| `v0.0.9` | `4020a010814881c84b016dd9beac3a33d6b0e8bc` | `8a737d755be4d3c4bd6a3c44fc69c0eb928e45ff` |

For each row, both of these checks succeeded:

```bash
git rev-parse <actions-head-sha>^{tree}
git rev-parse <current-tag>^{tree}
git diff --quiet <actions-head-sha> <current-tag>
```

Therefore the historical Actions commit and the current tag contain identical
tracked source trees, even though their commit identities differ. This proves
source-tree equivalence; it does not claim that the release artifacts are
reproducible byte-for-byte.

## Evidence sources

- `GET /repos/shreyam1008/gobarrygo/actions/runs/<run-id>` supplied each run's
  tag name, status, conclusion, timestamps, and `head_sha`.
- `GET /repos/shreyam1008/gobarrygo/releases/tags/<tag>` supplied each published
  release ID, timestamp, URL, and asset inventory.
- Fresh Git objects and remote tag refs supplied the current tag commits, tree
  IDs, and exact tree comparison.

## Preserved local history

These refs are intentionally preserved and must not be deleted during consolidation:

| Ref | Commit | Purpose |
| --- | --- | --- |
| `backup/before-date-rewrite-2026-06-18` | `2ae2351a144cf242a0f1f93a6d10e94943403bb1` | Original pre-rewrite lineage containing every Actions build commit in the table above. |
| `archive/before-date-rewrite-2026-06-18` | `2ae2351a144cf242a0f1f93a6d10e94943403bb1` | Explicit archival branch, published to `origin` and verified again before retirement preparation on 2026-08-24. |
| `codex/gobarrygo-native-ui` | `c8a23c8b0bc79246bfe0bae58379a32a9dc6b3ef` | Native UI refinement line that must remain discoverable during product consolidation. |

An all-refs Git bundle containing the preserved refs was created and verified
before retirement preparation. Its SHA-256 digest is
`f070678a5b72d135ad8e5966f6db4678905e04c86aad5ad02ae5a2d118c9c76d`.
Before any remote archival, verify that a retrievable copy still matches this
digest. No tag or release should be rewritten from this document alone.
