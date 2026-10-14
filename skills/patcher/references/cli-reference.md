# React Doctor CLI Reference

Command details last checked against React Doctor 0.5.1 on 2026-06-12. Check the installed CLI help if flags differ.


Preserve the existing project tooling by default. Vite+ with Bun is an optional setup choice; project migration requires explicit approval under SKILL.md. The examples use `vp dlx` for configured Vite+ projects. If migration is declined or not yet approved, preserve the existing runner: for Bun projects without Vite+, replace that prefix with `bunx`; otherwise use the existing package runner. Keep `@latest` and inspect current help when flags differ from this reference.

Install/run:

```bash
vp dlx react-doctor@latest
```

Run only for React projects and only when requested.

Supported project families from public docs include Next.js, Vite, and React Native. The CLI also has framework-aware rules and workspace/project selection.

CLI shape:

```bash
react-doctor [options] [command] [directory]
```

Default directory is `.`.

Options from `vp dlx react-doctor@latest --help`:

```text
-v, --version
--lint
--no-lint
--dead-code
--no-dead-code
--verbose
--score
--json
--json-compact
-y, --yes
--no-parallel
--project <name>
--diff [base]
--no-score
--category <category>
--no-telemetry
--staged
--blocking <level>
--no-respect-inline-disables
--warnings
--no-warnings
--sfw
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
vp dlx react-doctor@latest rules explain react-doctor/no-adjust-state-on-prop-change
vp dlx react-doctor@latest rules set react-doctor/no-adjust-state-on-prop-change error
vp dlx react-doctor@latest rules disable react-doctor/prefer-dynamic-import
vp dlx react-doctor@latest rules category Performance off
```

`install|setup` writes agent-specific React guidance/rules. Do not run it unless the user specifically asks to install React Doctor guidance into a project.

### Recommended Agent Runs

Full JSON diagnostic:

```bash
vp dlx react-doctor@latest <project-dir> --json --blocking none --diff false
```

Compact JSON:

```bash
vp dlx react-doctor@latest <project-dir> --json --json-compact --blocking none --diff false
```

Readable complete report:

```bash
vp dlx react-doctor@latest <project-dir> --verbose --blocking none --diff false
```

Score only:

```bash
vp dlx react-doctor@latest <project-dir> --score --blocking none --diff false
```

Changed files vs base:

```bash
vp dlx react-doctor@latest <project-dir> --json --blocking none --diff origin/main
```

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
- `--blocking none` never fails because of diagnostics; use this for exploratory agent runs.
- Older docs may mention `--fail-on <level>`; in `react-doctor 0.5.1` it is deprecated. Use `--blocking <level>`.

Diff behavior:

- `--diff [base]` scans changed files vs a base branch.
- `--staged` scans staged files only.
- `--diff false` forces a full scan and overrides diff configuration.
- `--full` was removed in `react-doctor 0.5.1`; do not use it.
- `--diff` and `--staged` cannot be combined.
- `--json` suppresses interactive prompts and is preferred for agent use.

Network and telemetry behavior:

- `--no-score` skips the score API, share URL, and crash reporting.
- `--no-telemetry` is an alias for `--no-score`.
- Older docs may mention `--offline`; current `react-doctor 0.5.1` help lists `--no-score` / `--no-telemetry` instead.

Configuration:

- Use `doctor.config.ts`, `.js`, `.mjs`, `.json`, `.jsonc`, or the `reactDoctor` key in `package.json`.
- `react-doctor.config.json` is legacy and should be migrated to `doctor.config.json`.
- CLI flags override config.
- Important config areas include `ignore.rules`, `ignore.files`, `ignore.overrides`, `surfaces`, `rules`, and `categories`.
- Prefer the narrowest ignore possible, especially `ignore.overrides` for one rule on one file/glob.
- For generated files, framework entry points, Convex/server runtime modules, shadcn primitives, or intentional static-analysis noise, prefer scoped `ignore.overrides` or `ignore.files` over risky code rewrites.

Inline suppressions:

```tsx
// react-doctor-disable-next-line react-doctor/no-cascading-set-state
```

Use suppressions only when the code is intentionally safe and the reason is clear.
