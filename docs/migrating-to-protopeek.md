# Move from GoBarryGo to ProtoPeek Downloader

GoBarryGo's continued downloader development moves into **ProtoPeek v0.5**. The
standalone GoBarryGo `v0.0.9` release remains available and usable; migration
copies compatible local state and does not delete or rewrite GoBarryGo files.

Do not follow these steps with ProtoPeek `v0.4.0` or an older build. The
Downloader and `migrate-gobarry` command begin with the stable `v0.5.0` release.

## Before you start

1. Install the released ProtoPeek `v0.5.0` package using the
   [ProtoPeek installation guide](https://github.com/shreyam1008/ProtoPeek/blob/master/guides/INSTALLING.md).
2. Install `aria2c` through your operating system or package manager. ProtoPeek
   uses an explicitly configured or system-installed `aria2c`; it does not
   bundle the engine.
3. Stop GoBarryGo and stop the ProtoPeek Downloader. This gives the preview a
   stable source snapshot and avoids competing transfer sessions.
4. Keep GoBarryGo `v0.0.9` installed until you have verified your imported
   preferences and paused session jobs.

## Preview first

Preview reads only GoBarryGo's known local profile and performs no writes:

```sh
pp migrate-gobarry
```

Review the reported preferences, session entries, unsupported settings, and
rejections. The preview never starts `aria2c`, deletes a download, or changes a
GoBarryGo file.

## Apply the compatible state

After the preview looks correct:

```sh
pp migrate-gobarry --apply
```

You can copy only one category when needed:

```sh
pp migrate-gobarry --preferences=false --apply  # session only
pp migrate-gobarry --session=false --apply      # preferences only
```

The import creates a receipt and private backups. Compatible HTTP(S) session
jobs enter ProtoPeek paused. Open ProtoPeek Downloader, inspect the destination
and options, then resume only the jobs you recognize.

## Guarded rollback

Use the receipt ID printed by the apply command:

```sh
pp migrate-gobarry --rollback RECEIPT_ID
```

Rollback proceeds only while current ProtoPeek transfer state still matches the
receipt. If newer work changed that state, it refuses instead of overwriting the
newer data. GoBarryGo files remain untouched either way.

## What is preserved

- GoBarryGo source, Git history, tags, screenshots, documentation, and releases.
- The public [`v0.0.9` release](https://github.com/shreyam1008/gobarrygo/releases/tag/v0.0.9)
  and its [SHA-256 checksums](https://github.com/shreyam1008/gobarrygo/releases/download/v0.0.9/checksums.txt).
- Downloaded files already present on disk.
- Unsupported GoBarryGo preferences are reported instead of silently invented
  as ProtoPeek settings.

The complete security, limits, idempotence, and rollback contract is in
[ProtoPeek's GoBarryGo consolidation guide](https://github.com/shreyam1008/ProtoPeek/blob/master/guides/gobarrygo-consolidation.md).
