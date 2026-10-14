# Hapstack

Hapstack is a portable engineering workflow plugin built from Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack), with reusable React diagnostics and project-aware shipping.

Use **hap-mode** as the entry point. It routes a task to the right skill or playbook. **patch to 100** uses the bundled patcher; **ship this** uses the bundled ship. Other requests use the adapted pstack workflows and engineering principles.

## Install

With Bun and Git installed, run:

~~~bash
bunx github:hapwi/hapstack
~~~

This installs Hapstack as **one native plugin per provider**, using the Codex and Claude Code plugin managers. Both selected providers need a plugin-capable CLI. It does not copy the bundled skills into your standalone skill folders or replace your personal patcher/ship. Each host owns the plugin cache, namespace, and enabled state. No Hapstack npm publication or MCP server is required.

Use `--agent codex` or `--agent claude-code` to select one provider. `--list` lists bundled skills without installing. `--help` shows options.

~~~bash
bunx github:hapwi/hapstack status
bunx github:hapwi/hapstack uninstall
~~~

Status shows the private installation record and the selected hosts' actual plugin inventory. Uninstall delegates to the native plugin manager. Settings, backups, and marketplace registrations remain; remove a registration separately only when you no longer want it as an install source.

### Native host commands

The Codex equivalent is:

~~~bash
codex plugin marketplace add hapwi/hapstack
codex plugin add hapstack@hapstack
codex plugin remove hapstack@hapstack
~~~

For Claude Code:

~~~bash
claude plugin marketplace add hapwi/hapstack
claude plugin install hapstack@hapstack
claude plugin uninstall hapstack@hapstack
~~~

The repository includes both catalogs and a Claude compatibility manifest alongside the portable root manifest. A catalog makes Hapstack installable from this repository; it does not place it in a host's universal public directory. ChatGPT desktop clients that support local marketplaces can browse the registered Codex source; availability and permissions depend on that client. The setup skill is declared as OpenAI onboarding, so supported clients can offer it after installation.

### Skill-only clients and project installs

For a client without native plugins, explicitly use tracked skill links:

~~~bash
bunx github:hapwi/hapstack --skills
bunx github:hapwi/hapstack --agent cursor
bunx github:hapwi/hapstack --project
~~~

Global linked installs keep a single bundle under `$XDG_DATA_HOME/hapstack/packages/` or `~/.local/share/hapstack/packages/`. Only discovery links go into each selected provider's skill folder. Project installs keep the bundle and record under `.agents/hapstack/` and use links in that project. `--project` selects this compatibility path rather than changing a global plugin installation. Add that generated directory and provider links to your project's ignore rules if you want the installation to stay local.

The private global receipt is `$XDG_STATE_HOME/hapstack/install.json` or `~/.local/state/hapstack/install.json`. It records owned links, bundle hashes, source/version, and original backups. Same-name skills are backed up before replacement. Uninstall removes only links still pointing to their recorded targets and restores originals. Replaced links and edited bundles are preserved and reported. Do not publish receipts or backups: they can contain private paths or customized skills. `--backup-dir PATH` changes the backup destination. Uninstall does not remove setup preferences or backups. Use the same scope and providers for status/removal; for example, `uninstall --project --agent cursor`.

### Migrate a 0.2 copied installation

First run the new native installer. Then supply the original backup directory printed by the old installer:

~~~bash
bunx github:hapwi/hapstack migrate --legacy-backup /path/to/original-backup
~~~

Migration requires recorded native installs for the selected providers. It archives only standalone directories whose entire contents match the recorded 0.2.0 fingerprints or the current bundled skills, then restores original same-name skills where that backup contains them. Changed or unrelated skills and untracked symlinks remain in place and are reported. The archived copies and original backups remain private. Resolve non-matching skills individually instead of treating their names as proof of ownership. Do not manually delete every skill matching the catalogue.

Start a new agent session after installation or migration. T3 Code uses the selected provider's plugin/skill discovery; this package does not add a T3 MCP server. Native skill names may be plugin-qualified in the picker. Choose Hapstack's `hap-mode`, which routes to its bundled siblings even when you have personal skills with the same names. If a T3/provider version doesn't surface native plugin skills, use the tracked skill-link install after uninstalling that provider's native plugin. Discovery in a running session is not guaranteed.

## Setup

For a native Codex plugin in T3 Code or Codex:

~~~text
$hapstack:setup-hapstack
$hapstack:hap-mode patch to 100
$hapstack:hap-mode ship this
$hapstack:hap-mode patch to 100 then ship
~~~

For linked standalone skills, use `$setup-hapstack` and `$hap-mode` instead. For a native Claude plugin, use `/hapstack:setup-hapstack` and `/hapstack:hap-mode patch to 100`. On other hosts use the supported picker form, which may be plugin-qualified. Exact picker syntax and persistent modes are host features.

Setup detects capabilities, discovers available models, lets you choose a reasoning budget and role/panel models, and selects delegation, tooling, and versioning preferences. It writes user settings outside the package. Project `.agent-workflow/hapstack.md` takes precedence over global `$XDG_CONFIG_HOME/hapstack/config.md` or `~/.config/hapstack/config.md`. Paths resolve for the current operator. See [configuration](skills/setup-hapstack/references/configuration.md).

Without setup, use the current model, delegation on request, existing tooling, and the repository's versioning policy. Setup does not migrate project tools, activate automations, send messages, or change the current chat's model. Model-role choices apply to permitted delegates through supported host APIs. No specific paid model is required.

## Included

- All 53 upstream top-level skills, with poteto-mode renamed hap-mode, poteto-help renamed hap-help, and setup-pstack renamed setup-hapstack.
- All 23 playbooks and 24 engineering principles.
- Patcher and ship, generalized for public use.
- Bundled deslop plus portable control-ui/control-cli adapters.
- Agent briefs, the ten-part guide, orchestration and PR helper sources, and the dormant Benny automation pack.

That is **58 top-level skills**. Principle skills are included in that total. Benny's three nested automation instruction files are separate from top-level skill discovery. See [the catalogue](CATALOG.md) and [the guide](docs/guide/README.md).

## How the mode routes work

`patch`, `patcher`, and React Doctor target-score requests route to patcher. Patcher works locally with the same agent, preserves the existing framework/package manager/linter, and runs its explicitly requested diagnosis, Improve audit, or fix-to-score workflow. Optional tooling and policy setup require their own selection.

`ship` and `release` route to ship. It resolves the actual remote/default branch, follows the selected versioning policy and repository gates, preserves unrelated work, and performs proven-merged cleanup. Shipping is separate from deployment, registry publishing, and messages. The inherited independent-verification shipping recipe is retained for an explicit verification request; ship still owns delivery.

Other tasks use the matching playbook. Named multi-agent skills can run parallel investigations or review when authorized and supported. A combined patch-and-ship task ships only after the patch acceptance criteria succeed; a blocked score is never reported as 100.

## Portability and prerequisites

[The runtime contract](skills/hap-mode/references/runtime.md) maps imported host concepts to actual available APIs and takes precedence over host-specific notation in the retained recipes.

- Ordinary explanations and local work need only the current agent and relevant project tools.
- Patcher's numeric React Doctor score needs React source and a supported package runner; upstream score/network availability can limit verification.
- Shipping needs Git and the correct forge tools/authentication. GitHub workflows use gh. Other hosts use their supported tools.
- T3 delegation, PR registration/watching, and scheduling use T3's existing tools when present. Another host uses its native equivalents. Missing tools are reported, not invented.
- Bun is needed only for optional inherited TypeScript helpers. The helper bootstrap installs its lockfile dependencies when that helper is explicitly invoked; setup does not run it. Graphite is optional for the inherited orch frontier command.
- The worktree audit needs Bash, Git, and its documented system utilities. It uses no default private transcript directory. An operator can supply HAPSTACK_TRANSCRIPTS_DIR for the selected workspace.
- Benny, webhook UIs, and persistent jobs need separately authorized setup and available service/scheduler controls. They are dormant at installation.

A public repo or portable manifest does not prove every workflow works on every host. This first version validates package metadata, references, discovery, and selected changed helpers; live multi-provider workflows and publishing to third-party services need their own authorized use and evidence.

## Updates and attribution

This is an independent adaptation, not an official Cursor or pstack release. [UPSTREAM](UPSTREAM) pins the source revision. Upstream changes are incorporated deliberately so they do not overwrite Hapstack's routing, user settings, or portable patcher/ship behavior. Native installation keeps personal skills separate; migration restores originals replaced by the earlier copy installer.

MIT licensed. [LICENSE](LICENSE) retains upstream copyright. [CREDITS.md](CREDITS.md) records the original authorship and adaptation. No private conversation, machine directory, credentials, or user configuration belongs in this repository.

