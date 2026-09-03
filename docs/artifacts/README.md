# Artifacts from the unattended build

This app was built by a Cursor cloud agent from a one-page idea, with no human
in the loop until a post-merge Node 26 install check. The kit that drove it is
[rvegajr/cloud-agents](https://github.com/rvegajr/cloud-agents).

## Download the whole repo

- Clone: `git clone https://github.com/rvegajr/snippet-vault.git`
- Zip of `main`: https://github.com/rvegajr/snippet-vault/archive/refs/heads/main.zip
- Tagged release (source + these files as attachments): https://github.com/rvegajr/snippet-vault/releases/tag/v1.0.0

## Files in this folder

| File | What it is |
| --- | --- |
| [build-state.json](./build-state.json) | Driver state after every milestone: idea, spec, per-milestone verification, finish-gate report |
| [usage.json](./usage.json) | Token counts and billed cost per cloud run |
| [build-live.log](./build-live.log) | Full terminal transcript of spec + 6 iterations + finish (~45 min) |
| [build-live-fix.log](./build-live-fix.log) | Transcript of the follow-up that bumped `better-sqlite3` for Node 26 |

## Git history (the product itself)

| What | Where |
| --- | --- |
| Spec and roadmap the agent wrote | [`SPEC.md`](../../SPEC.md), [`ROADMAP.md`](../../ROADMAP.md) |
| Merge that landed v1 | [PR #6](https://github.com/rvegajr/snippet-vault/pull/6) |
| Per-milestone stacked PRs (superseded by #6, still readable) | [#1](https://github.com/rvegajr/snippet-vault/pull/1) [#2](https://github.com/rvegajr/snippet-vault/pull/2) [#3](https://github.com/rvegajr/snippet-vault/pull/3) [#4](https://github.com/rvegajr/snippet-vault/pull/4) [#5](https://github.com/rvegajr/snippet-vault/pull/5) |
| Per-milestone branches | `cursor/m1-walking-skeleton-c301` … `cursor/m6-polish-release-c301` |
| Cloud agent | `bc-ea005c5a-d806-48d6-a791-45b85af0c301` (cursor.com/agents → Filter → Source → SDK) |

## Result numbers

- 6 milestones, 6 iterate turns, 0 stalls, 0 blocks
- 19 tests; lint, typecheck, and build green
- Finish gate verified all 7 user flows in `SPEC.md`
- About **$4.57** of tokens (`composer-2.5`)
