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
this with other patcher setup choices. Show the target path and template so the
choice is concrete. Prior explicit setup authorization is sufficient. Honor a
refusal throughout the conversation; do not create opt-out files or repeatedly
ask during fix loops. Without an answer, continue other authorized work without
installing the policy. Read-only runs do not install or update it unless the user
explicitly selects setup. A policy-only setup request does not trigger React
Doctor, lint, an Improve audit, or tooling installation.

## Insert or reconcile

- Missing file: create `AGENTS.md` containing the complete template.
- Existing file without a related policy: append the template with a separating
  blank line; preserve the existing content.
- Exactly one complete marked block identical to the template: leave it untouched
  and do not ask to install again.
- Exactly one complete marked block with different contents: inspect the
  differences. On an authorized editing run, update only that block for routine
  template changes. If the differences contain project-specific exceptions or
  materially change obligations, present the exact reconciliation and obtain the
  missing policy decision before replacement. Marker presence is not permission
  to discard project customizations. A read-only run only reports an available update.
- Unmarked existing or inherited changelog/release policy: compare it with the
  template. After setup is selected, equivalent sections in the target file can
  be replaced with the marked template. Preserve unrelated text. If policy
  differs, propose the exact reconciliation and resolve conflicts before editing;
  do not append contradictory instructions or change inherited files implicitly.
- Missing, reversed, nested, or duplicate markers: report the malformed block and
  resolve its intended boundaries before replacing anything. Do not guess a range
  that could remove unrelated instructions.

When policy decisions prevent using the exact template, preserve the current
file and report setup pending rather than claiming the standard policy is installed.
Continue other authorized work where it does not depend on that decision.

## Finish

For a policy installation or update, create `CHANGELOG.md` if absent with a
`# Changelog` heading and `## [Unreleased]` section. Record one concise entry for
the completed setup, following an existing changelog's format and preserving its
history and unrelated entries. An unchanged policy needs no setup entry. Do not
backfill unrelated changes, bump versions, or perform release actions.

Check that the installed block matches the template, has exactly one marker pair,
and that content outside the authorized edit is preserved. Report the affected
paths and whether the policy was installed, updated, already present, declined,
or pending reconciliation. No application checks are required solely for these
Markdown edits. Subsequent work follows the installed project instructions.
