# React Doctor CLI Reference

Command details last checked against the published React Doctor 0.9.18 CLI help on 2026-10-14. This is a documentation snapshot, not a tool version pin. Patcher runs `react-doctor@latest`; its own skill metadata version is independent. Check the resolved CLI help and package requirements if they differ.

Official sources: [CLI reference](https://www.react.doctor/docs/reference/cli-reference), [configuration](https://www.react.doctor/docs/configuration/config-files), [changelog](https://www.react.doctor/docs/community/changelog), and [published package metadata](https://registry.npmjs.org/react-doctor/latest). Version 0.9.18 requires Node.js `^20.19.0 || >=22.13.0`.

Preserve the existing project tooling by default. Vite+ with Bun is an optional setup choice; project migration requires explicit approval under SKILL.md. The examples use `vp dlx` for configured Vite+ projects. If migration is declined or not yet approved, preserve the existing runner: for Bun projects without Vite+, replace that prefix with `bunx`; otherwise use the existing package runner. Keep `@latest` and inspect current help when flags differ from this reference.

Install/run:

```bash
vp dlx react-doctor@latest
```

Run only for React projects and only when requested.

Supported project families from public docs include Next.js, Vite, Astro, TanStack, React Native, and Expo. The CLI also has framework-aware rules and workspace/project selection.

CLI shape:

```bash
react-doctor [options] [command] [paths...]
```

Pass one project directory or selected source files. With no paths, the directory is `.`.

Relevant scan options from the published CLI help (use `--help` for the full list):

```text
-v, --version
--lint
--no-lint
--supply-chain
--no-supply-chain
--verbose
--score
--json
--json-compact
--json-out <path>
--no-cache
-y, --yes
--no-parallel
--project <name>
--scope <value>
--base <ref>
--baseline <report.json>
--include-untracked
--no-score
--category <category>
--no-telemetry
--staged
--blocking <level>
--warning-exit-code <code>
--max-duration <seconds>
--no-respect-inline-disables
--warnings
--no-warnings
--color
--no-color
-h, --help
```

Commands:

```bash
vp dlx react-doctor@latest install
vp dlx react-doctor@latest setup
vp dlx react-doctor@latest why path/to/file.tsx:42
vp dlx react-doctor@latest rules list
vp dlx react-doctor@latest rules explain react-doctor/no-array-index-as-key
vp dlx react-doctor@latest rules set react-doctor/no-array-index-as-key error
vp dlx react-doctor@latest rules disable react-doctor/no-danger
vp dlx react-doctor@latest rules category Performance off
```

`install|setup` installs agent skills and can install hooks. The `ci install|config|upgrade` commands manage CI files. Use these only when the user requests the corresponding setup. Rule setters, disablers, and category commands also write configuration; listing or explaining rules is read-only. React Doctor's separate `design` audit and runtime `scan <url>` profiler do not replace Patcher Improve and are not part of a default Patcher run.

### Recommended Agent Runs

Full JSON diagnostic:

```bash
vp dlx react-doctor@latest <project-dir> --json --blocking none --scope full
```

Compact JSON:

```bash
vp dlx react-doctor@latest <project-dir> --json --json-compact --blocking none --scope full
```

Readable complete report:

```bash
vp dlx react-doctor@latest <project-dir> --verbose --blocking none --scope full
```

Score only:

```bash
vp dlx react-doctor@latest <project-dir> --score --blocking none --scope full
```

All findings in changed files vs base:

```bash
vp dlx react-doctor@latest <project-dir> --json --blocking none --scope files --base origin/main
```

For only newly introduced findings, use `--scope changed --base origin/main` instead. The `lines` scope filters to changed source ranges; `contextual` includes findings in modified rule contexts. Select these only when the requested review calls for them.

Staged files:

```bash
vp dlx react-doctor@latest <project-dir> --json --blocking none --staged
```

Explain a finding or suppression:

```bash
vp dlx react-doctor@latest why path/to/file.tsx:42
```

CI gating:

```bash
vp dlx react-doctor@latest --blocking error
vp dlx react-doctor@latest --blocking warning
vp dlx react-doctor@latest --blocking none
```

Exit-code behavior:

- `--blocking error` is the default and exits non-zero when error-severity diagnostics fire.
- `--blocking warning` exits non-zero on any diagnostic.
- `--blocking none` does not fail because of diagnostics; execution failures still need investigation.
- `--warning-exit-code <code>` can give non-blocking warnings a distinct exit code (2–255); it is ignored with `--blocking none` or `--score`.
- Use `--blocking`, not the old `--fail-on` flag.

Scope and output behavior:

- `--scope full` explicitly requests the full project, overriding configured partial scope. Use it for a full-project score.
- `--scope files` reports all findings in changed files; `--scope changed` compares against the base and reports introduced findings. Set the base with `--base <ref>`.
- `--staged` selects the git index; `--include-untracked` includes ordinary untracked files in working-tree partial scans while respecting `.gitignore`.
- `--diff` is a deprecated alias for changed scope. Use the explicit scope flags instead of old `--diff false` or `--full` examples.
- `--project` accepts workspace names or directory paths, comma-separated; quote `"*"` for all projects. JSON includes per-project reports and an aggregate score.
- `--json` suppresses human-readable output; errors can still return JSON with `ok: false`. Account for package-runner progress outside the JSON. `--json-out <path>` writes the report to a file.
- `--max-duration` can return partial results with skipped files or projects. Inspect completeness and failures before reporting success; a partial or selected-file score cannot verify a full-project 100.

Network and telemetry behavior:

- `--no-score` skips the score API, share URL, and crash reporting.
- `--no-telemetry` is an alias for `--no-score`.
- Socket.dev checks direct dependencies by default, independently of score/telemetry opt-out. Add `--no-supply-chain` when those network requests must be avoided, reporting the missing coverage. Package-runner downloads can still use the network.
- These diagnostic flags do not install agent guidance, hooks, or CI. Supply-chain findings do not authorize dependency upgrades.

Configuration:

- Use `doctor.config.ts`, `.mts`, `.cts`, `.js`, `.mjs`, `.cjs`, `.json`, `.jsonc`, or the `reactDoctor` key in `package.json`.
- `react-doctor.config.json` is legacy and should be migrated to `doctor.config.json`.
- CLI flags override config.
- Important config areas include `scope`, `base`, `projects`, `supplyChain`, `ignore.rules`, `ignore.files`, `ignore.overrides`, `surfaces`, `rules`, and `categories`.
- Optional project-graph rules for unused code, dependencies, and cycles require explicit `rules` entries and full scans. Do not enable them implicitly or claim they ran from the score alone. `--dead-code` / `--no-dead-code` are no longer scan options; the deprecated `deadCode` config key is not a general unused-code coverage toggle.
- Prefer the narrowest ignore possible, especially `ignore.overrides` for one rule on one file/glob.
- For generated files, framework entry points, Convex/server runtime modules, shadcn primitives, or intentional static-analysis noise, prefer scoped `ignore.overrides` or `ignore.files` over risky code rewrites.

Inline suppressions:

```tsx
// react-doctor-disable-next-line react-doctor/no-cascading-set-state
```

Use suppressions only when the code is intentionally safe and the reason is clear.
