# Changelog

## Unreleased

## 0.6.0 - 2026-11-16

Hapstack is leaner and can now take a change all the way to a merged pull request on its own, with a plain-language changelog kept along the way.

### Action needed
- Arena, swarm, make-bot-ui, the Benny automation pack, and the autopilot and orchestration modes have been removed. If you used them, ask hap-mode for the task directly. It still runs design comparisons and parallel work when you ask for them.

### New
- Say `full send` and your agent takes a change all the way to a merged pull request while you're away: it checks the change works, gets it reviewed, opens the pull request, handles review feedback, and merges it. Say `full stop` to do the same but leave the final merge to you.
- A new changelog skill keeps a plain-language changelog for your project. It creates one if you don't have one, adds an entry with each pull request, finds changes that are missing, and prepares each release.

### Improved
- Pull request titles now say why a change matters, and descriptions open with the problem it solves.
- Watching a pull request is simpler and quieter, and fixes found during review no longer make the pull request grow beyond its purpose.
- The 24 engineering principles no longer fill your skill list. hap-mode still uses them.
- Changelogs now record every meaningful change, including behind-the-scenes work, written in plain words for people who use the product, with clear steps whenever you need to do something.
- The changelog rules Hapstack adds to your project's AGENTS.md now show their version, and Hapstack keeps them up to date for you. If you have edited them, Hapstack leaves your version alone and shows you the new one to approve instead.
- Written plans for larger projects are lighter: each step needs only the checks that prove it works, instead of a fixed set of ten.
- Hapstack is smaller and quicker to install and update, now that helper programs it no longer needs are gone.
- Credits now include tstack by Theo Browne, which the new pull request features build on.

### Fixed
- Updating Hapstack now removes leftover skills it no longer includes and brings back any skill of yours that one had replaced.

## 0.5.3 - 2026-10-19

- Authorized shipping now selects the recommended version from project policy and included changes by default, reports its rationale, and asks only for unresolved compatibility or conflicting release-policy decisions. Explicit target versions, prerelease progression, and repository approval gates remain in effect.

## 0.5.2 - 2026-10-19

- Changelogs and release notes describe user-visible product behavior, including setup and testing-tool features, while omitting internal work narration, test runs, and local-machine setup.
- Changelog policy setup no longer requires an entry solely for installing or updating the policy.

## 0.5.1 - 2026-10-19

- Clean up proven task-owned, delivered implementation worktrees during ship, including worktrees created before shipping began, before deleting their branches.
- Require exact ownership and delivery evidence for squash/rebase merges; retain local files, extra commits, protected branches, needed stack dependencies, and active or unknown host bindings.
- Replace forced worktree deletion with the supported host lifecycle or ordinary Git removal, and record private receipts for safe cleanup after a shipping worker finishes.
- Extend the existing audit helper to flag ignored/untracked files, locks, missing paths, and in-progress operations, with isolated Git fixture checks.

## 0.5.0 - 2026-10-18

- Share version and changelog tracking across the ship flow, follow supplied release versions, and ask for a version choice unless automatic selection was explicitly delegated.
- Establish missing changelogs during authorized ship/project setup, keep pending changes under Unreleased, and preserve existing tracking sources and formats.
- Add optional nightly support, off by default, with unique published candidates, exact tested commit promotion, and one owner for automated version updates.
- Document setup preferences and unchanged project-first configuration precedence without installing infrastructure or changing personal settings.

## 0.4.4 - 2026-10-15

- Unify install, status, updates, removal, help, and errors around compact provider rows, consistent spacing, and clear next actions.
- Let active spinners settle into result lines, keep progress within narrow terminals, and reserve color for actions and findings that need attention.
- Preserve conservative update prompts and read-only JSON, hide receipt mismatches behind verbose output, and clearly report managed links kept during partial removal.

## 0.4.3 - 2026-10-15

- Redesign status with an animated header, aligned provider columns, terminal colors, and a compact layout for narrow terminals.
- Label outdated installations clearly and offer an interactive update prompt; update only outdated providers after approval, while keeping JSON status read-only.
- Resolve GitHub version checks to exact commits to avoid stale release metadata, and show receipt mismatches only with verbose output.

## 0.4.2 - 2026-10-15

- Refresh Patcher guidance against React Doctor 0.9.18 while continuing to run `react-doctor@latest`.
- Replace deprecated diff examples with explicit scan scopes and clarify partial results, optional project-graph coverage, and runtime compatibility.
- Document default supply-chain network checks separately from telemetry controls and preserve explicit setup and dependency-upgrade authorization.

## 0.4.1 - 2026-10-14

- Add a stable launcher that refreshes a stale CLI through an exact source commit while preserving arguments, terminal prompts, and exit status.
- Keep cached CLI use explicit when GitHub cannot be checked, and prevent recursive or mismatched release handoffs.
- Add a targeted `refresh-cli` migration for older unqualified Bun cache entries without clearing other packages or changing installed plugins.

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

