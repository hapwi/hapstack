# Set up the project changelog policy

Use [the bundled template](../assets/changelog-AGENTS.md) verbatim, including its
`agent-changelog-start` and `agent-changelog-end` comment lines. Resolve it relative
to the installed skill, not the working directory or a remote URL. Do not keep
another policy copy in this skill or fetch one at runtime.

## Target and consent

Read applicable repository instructions and the target root `AGENTS.md` first.
Use the repository root for a repository-wide request. For a request limited to
one monorepo app, use that app's root and consider inherited instructions; do not
change sibling apps or impose a workspace-wide policy implicitly.

If the policy is absent, offer to install it or continue without it, combining
this with any other setup choices in the same request. Show the target path and template so the
choice is concrete. Prior explicit setup authorization is sufficient. Honor a
refusal throughout the conversation; do not create opt-out files or repeatedly
ask during fix loops. Without an answer, continue other authorized work without
installing the policy. Read-only runs do not install or update it unless the user
explicitly selects setup. A policy-only setup request does not trigger diagnostics, lint, or tooling
installation.

## Insert or reconcile

Run `scripts/policy.mjs <AGENTS.md>` first and act on its status:

- `missing` with no `AGENTS.md`: create `AGENTS.md` containing the complete template.
- `missing` with an existing `AGENTS.md` and no related policy: append the template after a blank line and keep the existing content.
- `missing` with an unmarked changelog or release policy already in the file or inherited from a parent: compare it with the template. After setup is selected, replace equivalent sections in the target file with the marked template and keep unrelated text. If the policies differ, propose the exact reconciliation and settle conflicts before editing. Never append contradictory instructions or change inherited files implicitly.
- `current`: leave it untouched and do not offer it again.
- `outdated`: rerun with `--update` on any run that may edit files. Only the marked section changes.
- `customized`: show the differences and get the user's decision before replacing anything. Marker presence is not permission to discard project customizations.
- `newer` or `malformed`: leave the file alone. For malformed markers, settle the intended boundaries with the user before replacing anything.

When policy decisions prevent using the exact template, preserve the current
file and report setup pending rather than claiming the standard policy is installed.
Continue other authorized work where it does not depend on that decision.

## Finish

For a policy installation or update, create `CHANGELOG.md` if absent, using the
layout in [the writing guide](writing.md). Follow the template's writing rules
and the existing changelog's format. Installing or
updating the policy alone needs no entry. If the same work changes product
behavior, describe that behavior for users. Preserve history and unrelated
entries. Do not backfill unrelated changes, bump versions, or perform release
actions.

Check that the installed block matches the template, has exactly one marker pair,
and that content outside the authorized edit is preserved. Report the affected
paths and whether the policy was installed, updated, already present, declined,
or pending reconciliation. No application checks are required solely for these
Markdown edits. Subsequent work follows the installed project instructions.
