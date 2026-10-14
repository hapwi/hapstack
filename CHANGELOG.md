# Changelog

## 0.4.0 - 2026-10-13

- Show concise provider status with terminal colors and animated progress, keeping host logs behind `--verbose`.
- Check actual installed versions against the selected source and ask before updating existing plugins or skill links. Use `--yes` for unattended updates; the default prompt answer is No.
- Keep status read-only, add `status --json`, and distinguish unavailable update checks from an up-to-date installation.
- Preserve partial installation records and show actionable host errors without changing backup and restoration rules.

## 0.3.2 - 2026-10-13

- Correct shipping, forge selection, and T3 watcher routes while preserving the pstack playbooks.
- Resolve bundled instructions and helper commands from the installed package, and honor project-first model settings in Arena and Swarm.
- Restore verification-after-rebase rules with safeguards for base changes and explicit upstream attribution.
- Clarify on-request versus workflow delegation and update plan validation for installed instruction paths.

## 0.3.1 - 2026-10-13

- Add an original transparent Hapstack logo and OpenAI plugin/composer branding.
- Align help and catalogue descriptions with native skill names and comment-review scope.
- Record the installed native plugin version reported by the host when refreshing an existing installation.

## 0.3.0 - 2026-10-13

- Use native Codex and Claude plugin installation by default, with portable and Claude marketplace catalogs.
- Add status, native uninstall, and a tracked single-bundle skill-link fallback for project and skill-only clients.
- Record ownership and preserve replaced skills, changed links, edited bundles, settings, and private backups.
- Add conservative migration of exact-matching copies from the earlier installer, restoring original standalone skills.
- Declare optional OpenAI setup onboarding without requiring setup before hap-mode.
- Clarify no-comments diff scope, explicit whole-project scope, and empty-diff reporting.

## 0.2.0 - 2026-10-13

- Add a GitHub-backed Bun installer with a short command and automatic backups of existing same-name skills.
- Support project scope, provider selection, and read-only bundle inspection.
- Use bunx in installation examples and keep delegate briefs inside the installed skill resources.

## 0.1.0 - 2026-10-13

- Import the full pstack workflow library with attribution and a pinned source revision.
- Add hap-mode routing for patch-to-score, shipping, and combined patch-then-ship tasks.
- Bundle public, project-aware patcher and ship skills with configurable tooling/versioning.
- Add portable setup, live model-role discovery, host runtime mappings, and UI/CLI control adapters.
- Adapt dormant automation instructions and remove private-machine assumptions from publication sources.

