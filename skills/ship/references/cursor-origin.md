# Cursor Origin

Use this path for Cursor Origin targets. Consult the linked docs and installed command help when capabilities differ; Origin is evolving.

## Identify the source of truth

Origin URLs use `https://origin.cursor.com/OWNER/REPO.git`; the web interface lives at `https://cursor.com/codebase/OWNER/REPO`. Confirm repository metadata before deciding whether this is native hosting or a GitHub mirror. The hostname alone cannot distinguish them.

- **Native Origin:** Git and PR delivery remain on Origin. Use the `origin` CLI for review operations.
- **GitHub mirror:** Resolve the actual upstream GitHub repository and use its PR state for merge verification. Ordinary pushes through the Origin clone URL forward to GitHub. Verify delivery upstream, allowing for mirror lag; do not infer completion from the mirror alone.
- `origin push local` stores `origin/*` workspace branches only on the mirror. It does not deliver to GitHub or ship the default branch. Do not use it as a fallback for a failed shipment.

Sources: [Origin overview](https://cursor.com/docs/origin), [Git and mirror behavior](https://cursor.com/docs/origin/git).

## Discover native Origin work

The `origin` executable is separate from Cursor’s `agent` CLI and from a Git remote named `origin`. Check availability and authentication; if missing, report the prerequisite using the [CLI setup docs](https://cursor.com/docs/origin/cli).

```sh
origin --version
origin auth status
origin repo view OWNER/REPO --json org,name,defaultBranch
origin ruleset list -R OWNER/REPO
origin ruleset view RULESET_ID -R OWNER/REPO
origin pr list -R OWNER/REPO --state open
origin pr list -R OWNER/REPO --state draft
origin pr view NUMBER -R OWNER/REPO --checks --comments
origin pr diff NUMBER -R OWNER/REPO
origin pr checks NUMBER -R OWNER/REPO
```

Inspect applicable push and merge rules. Explicit `-R` avoids inference from the wrong remote. Use supported JSON fields or the documented `origin api` interface when more metadata is needed.

Source: [CLI commands](https://cursor.com/docs/origin/cli/reference/commands).

## Create, merge, and clean up

Lists default to 30 results; increase `--limit` or use documented API pagination until discovery is complete. Open and draft are separate states. Read the exact head and base; bare `origin pr view NUMBER -R OWNER/REPO --json` lists supported fields.

When creating a required shipping PR, explicitly set `--head`, `--base`, and `--status open`; creation otherwise defaults to draft. Push through the verified remote first. Existing drafts still require authorization before marking ready.

For stack retargeting, use `origin pr edit NUMBER -R OWNER/REPO --base DEFAULT`. If inspection still shows an old head after pushing, `origin pr refresh NUMBER -R OWNER/REPO` refreshes the snapshot; then inspect again.

Before `origin pr merge NUMBER -R OWNER/REPO`, inspect `--help` and documented API capabilities for the shared inspected-head guarantee. Do not invent GitHub’s `--match-head-commit`, merge-method flags, or `--required`. If no supported interface can enforce the inspected head, report that blocker before merging. Preserve all shared readiness and cleanup requirements.

Source: [PR commands](https://cursor.com/docs/origin/cli/reference/pull-requests).
