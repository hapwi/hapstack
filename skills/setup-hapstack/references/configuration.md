# Hapstack configuration

The runtime defines discovery: project `.agent-workflow/hapstack.md` first, then `$XDG_CONFIG_HOME/hapstack/config.md` or `~/.config/hapstack/config.md`. Resolve the actual operator's environment/home. A project file is a complete override, not a silent merge of global review panels. Settings live outside the installed plugin.

Use a Markdown document with this YAML block. Omitted preferences use these defaults. Preserve unrelated content and unknown user settings on setup reruns.

```yaml
schema: 1
budget: medium
delegation: on-request
tooling: preserve
versioning: project
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
  arena runners: [inherit-parent, inherit-parent]
  arena cross-judge pool: [inherit-parent]
  swarm workers: inherit-parent
  architect runners: [inherit-parent, inherit-parent]
  interrogate reviewers: [inherit-parent, inherit-parent]
```

- `budget`: small, medium, large, unlimited. These are effort preferences, not guarantees of cost or context.
- `delegation`: on-request or workflow. Explicit user/repository limits still win.
- `tooling`: preserve or vite-plus-bun. A preference can offer setup; it never authorizes automatic migration.
- `versioning`: project, bump-on-ship, release-only. Project follows repository conventions. Bump-on-ship prepares a version per authorized shipment when a version source exists. Release-only changes a version for an explicit release request. None invents a manifest or bypasses gates.
- `changelog_policy`: on-request or offer. Offer allows patcher to present its optional template; installation still requires the user's selection.
- Role values are `inherit-parent`, alias `auto`, or objects with verified `provider`, `model`, and optional `options`. Panels are nonempty lists of such values, one run per entry. IDs and option values come from live discovery, never constructed effort suffixes.

Current-model panels provide independent runs but not model diversity. This file does not change the current chat's model/effort; it configures permitted delegates through supported host APIs.

Never place tokens, actual home paths, private repository identifiers, transcripts, or webhook URLs in shared examples. Inspect project configuration before any public commit. Global configuration is personal and must not be committed.
