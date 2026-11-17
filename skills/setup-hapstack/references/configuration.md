# Hapstack configuration

The runtime defines discovery: project `.agent-workflow/hapstack.md` first, then `$XDG_CONFIG_HOME/hapstack/config.md` or `~/.config/hapstack/config.md`. Resolve the actual operator's environment/home. A project file is a complete override, not a silent merge of global review panels. Settings live outside the installed plugin.

Use a Markdown document with this YAML block. Omitted preferences use these defaults. Preserve unrelated content and unknown user settings on setup reruns.

```yaml
schema: 1
budget: medium
delegation: on-request
tooling: preserve
versioning: project
nightly: false
changelog_policy: on-request
roles:
  feature, refactoring: inherit-parent
  bug-fix: inherit-parent
  perf-issue: inherit-parent
  hillclimb: inherit-parent
  judgment and prose: inherit-parent
  hardest tasks: inherit-parent
  how explorer: inherit-parent
  how explainer: inherit-parent
  why investigators: inherit-parent
  why synthesizer: inherit-parent
  reflect tooling: inherit-parent
  reflect judgment, divergent, synthesizer: inherit-parent
  architect runners: [inherit-parent, inherit-parent]
  interrogate reviewers: [inherit-parent, inherit-parent]
```

- `budget`: small, medium, large, unlimited. These are effort preferences, not guarantees of cost or context.
- `delegation`: on-request or workflow. Explicit user/repository limits still win.
- `tooling`: preserve or vite-plus-bun. A preference can offer setup; it never authorizes automatic migration.
- `versioning`: project, bump-on-ship, release-only. Project follows repository conventions. Bump-on-ship prepares a version per authorized shipment when a version source exists. Release-only changes a version for an explicit release request. The policy controls when a version is needed. For authorized shipping, ship follows a supplied target version or selects the recommended version from project policy and included changes without a routine question. It reports the rationale, preserves prerelease progression, and asks only for unresolved compatibility or conflicting release-policy decisions. None invents a manifest or bypasses gates.
- `nightly`: boolean, default `false`. Optional nightly publication and exact tested candidate promotion within the common ship flow. Development pushes/builds do not become releases. Nightlies use unique prerelease versions without stable bump commits; stable promotion uses the tested published candidate SHA rather than moving integration HEAD. Existing automation owns its version/finalization steps, without competing local bumps. See [optional nightly releases](../../ship/references/nightly-releases.md). This preference grants no infrastructure setup, scheduling, publication, deployment, or messaging authority.
- `changelog_policy`: on-request or offer. Offer allows patcher to present the changelog skill's optional project policy; installation still requires the user's selection. This setting does not disable ship's common changelog tracking. Authorized ship/project setup preserves the established changelog or creates `CHANGELOG.md` with Unreleased when absent. Entries follow [the changelog writing guide](../../changelog/references/writing.md) and describe changed product behavior. Installing a policy or setting up one operator's machine alone needs no entry. Release moves only included changes into a dated version entry.
- Role values are `inherit-parent`, alias `auto`, or objects with verified `provider`, `model`, and optional `options`. Panels are nonempty lists of such values, one run per entry. IDs and option values come from live discovery, never constructed effort suffixes.

Current-model panels provide independent runs but not model diversity. This file does not change the current chat's model/effort; it configures permitted delegates through supported host APIs.

Existing schema-1 files remain valid without `nightly`; omission means off. A project file still replaces the global file entirely, so an omitted project preference uses its default rather than inheriting a global value. Setup preserves unrelated content and unknown or legacy keys. There is one ship flow with shared tracking. If no version source exists, ship/setup recommends an appropriate tracking location and initial version from project context. It asks only if the starting version or tracking policy remains unresolved, instead of creating an arbitrary package/runtime manifest.

Never place tokens, actual home paths, private repository identifiers, transcripts, or webhook URLs in shared examples. Inspect project configuration before any public commit. Global configuration is personal and must not be committed.
