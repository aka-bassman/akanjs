---
"akanjs": patch
---

fix(devkit): find created directories on a filesystem with a coarse mtime clock

`SourceMtimeIndex` finds new files by noticing their directory's mtime moved, which Linux
stamps from a coarse clock: 400 back-to-back `mkdir`s left the parent's mtime unmoved 319
times on overlayfs and 324 times on ext4, smallest observable step 1ms. macOS APFS
(0.042ms) missed none, which is why this only ever showed up on Linux.

A directory mutated in the same millisecond as the recorded value — but after the walk that
recorded it — therefore left no trace, and because its files were never tracked, later edits
to them went unreported for the life of the process. Directories whose mtime was still fresh
when it was read are now re-walked on the next scan (`dirSettleMs`, 20ms default), and
`HmrWatcher` schedules one more scan while any remain unsettled.
