---
name: changelog
description: Set up, update, check, and release a project's public changelog, a full
  record of meaningful changes written in plain words for people who use the product. Use for "set up a changelog",
  "add a changelog entry", "update the changelog", "is our changelog up to date",
  "write release notes", or when ship, Opening a PR, or Full send reaches a changelog step.
license: MIT
---

# Changelog

The changelog is a full record of meaningful changes, including behind-the-scenes work, and it is public. It is written for people who use the product, who may not be technical. Every entry follows [the writing guide](references/writing.md). Read it before writing or reviewing any entry.

## Find the changelog

Look for an existing changelog before creating anything: `CHANGELOG.md`, `CHANGES.md`, `HISTORY.md`, `RELEASES.md`, or a changelog page the repository instructions name. In a monorepo, use the changelog of the package or app that changed, and the root one only when the project keeps a single shared log. Keep the existing file's layout, headings, and date format. Never create a second changelog next to an established one.

## Set up

When a project has no changelog and the work is authorized to edit it, create `CHANGELOG.md` using the layout in the writing guide, with an empty `## Unreleased` section. Do not backfill old history unless asked. When asked to backfill, summarize past releases from the project's history in the same plain style, and mark anything you could not date.

To make every agent in the project keep the changelog, install [the project policy](assets/changelog-AGENTS.md) into the project's `AGENTS.md` following [policy setup](references/policy-setup.md). It installs only with the user's consent, keeps project customizations, and updates only its own marked block.

Setting up a changelog or its policy needs no entry of its own.

## Keep the project policy current

Every time this skill runs in a project, check the project's changelog policy first. Run the checker on the `AGENTS.md` that holds the policy (the repository root, or the app root in a monorepo):

```bash
node "<this skill's directory>/scripts/policy.mjs" <path/to/AGENTS.md> --update
```

Pass `--update` only when the current task may edit files. It prints one line:

- `current: vN`. Nothing to do.
- `updated: vN to vM`. The project had an unedited earlier Hapstack policy, and the checker replaced only that marked section. This is routine and needs no approval. Mention it in your report.
- `outdated: vN can update to vM`. Shown without `--update`. Report that an update is available.
- `customized: …`. Someone edited the section. Leave it as is. Show the user how their text differs from the latest template and offer the update; apply it only with their approval, keeping their project-specific rules.
- `missing: …`. The project has no policy. Install it only when the user asks or their Hapstack settings say to offer it, per [policy setup](references/policy-setup.md).
- `newer: …` or `malformed: …`. Leave the file alone and report the line.

## Add entries

1. Look at what the change does: the diff, the PR, and the original request. Every meaningful change gets an entry, including behind-the-scenes work, per the writing guide's **What to include**. Skip only the noise that section lists, and say so when you skip.
2. Write the entry per the writing guide under `## Unreleased`, in the right section.
3. If a related entry is already under Unreleased, update it rather than adding a near-duplicate. When a later change undoes or replaces an unreleased one, edit or remove the earlier entry so Unreleased describes the product as it will ship.
4. Put the entry in the same commit or PR as the change.

## Check the changelog

For "is our changelog up to date" or a review:

1. Find the last release in the changelog, then list the changes merged since then from the project's history.
2. Mark each change as covered, missing, or noise.
3. Read every Unreleased entry against the test in the writing guide.
4. Report missing entries and entries that fail the test, each with a proposed rewrite. Edit only when asked or when the current task authorizes changelog edits. Leave released sections alone unless the user asks to rewrite history.

## Release

Ship owns the version choice. When a release is authorized:

1. Move only the shipped entries from Unreleased into a new section headed with the version and a `YYYY-MM-DD` date, newest first. Leave unrelated pending entries under Unreleased, and keep an empty Unreleased section.
2. Put **Action needed** entries first.
3. When the release has several entries, add one plain sentence under the heading that sums up the highlights.
4. Release notes for a forge or store use the same text as that section.

## Before you finish

Reread every entry you wrote or changed as a user who has never seen the code. Each one passes the writing guide's test, has no internal names or work narration, and makes sense on its own. Report the changelog path and the entries added, changed, or proposed.
