# Hapstack

Hapstack is a portable engineering workflow plugin built from Lauren Tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack), with reusable React diagnostics and project-aware shipping.

Use **hap-mode** as the entry point. It routes a task to the right skill or playbook. **patch to 100** uses the bundled patcher; **ship this** uses the bundled ship. Other requests use the adapted pstack workflows and engineering principles.

## Install

With Bun and Git installed, run:

~~~bash
bunx github:hapwi/hapstack
~~~

This runs the installer directly from this public GitHub repository. No Hapstack npm publication is required. It installs all skills globally for Codex and Claude Code, backing up existing same-name skills first. Backups are stored outside the installed skill directories under the operator's XDG state directory or home-derived state directory. They can contain private customized skills; do not publish them.

For one project, run it from the project root:

~~~bash
bunx github:hapwi/hapstack --project
~~~

Use `--agent cursor` or repeat `--agent` to choose providers. `--list` inspects the bundle without installing. `--help` shows the available options. The installer does not configure models, run diagnostics, ship work, or activate jobs.

A compatible Agent Plugins client can also load root plugin.json. For the underlying [skills CLI](https://github.com/vercel-labs/skills), the equivalent is:

~~~bash
bunx skills add hapwi/hapstack --skill '*' -g -a codex -a claude-code
~~~

Unlike the Hapstack entry point, calling the skills CLI directly does not perform Hapstack's backups. Standard npm users can use `npx skills` instead of `bunx skills`; configured Vite+ projects can use `vp dlx skills`. Choose one installation scope to avoid duplicate discovery. Install the whole set because workflows reference sibling resources.

Start a new agent session or use the host's documented skill reload. T3 Code uses the skills available to the selected underlying provider; this is not a new T3 MCP server. If the picker does not show a skill, verify provider discovery or explicitly point the agent to the installed SKILL.md rather than claim installation succeeded.

## Setup

In a Codex thread:

~~~text
$setup-hapstack
$hap-mode patch to 100
$hap-mode ship this
$hap-mode patch to 100 then ship
~~~

On slash-based hosts use the supported slash form, which may be plugin-qualified. Exact picker syntax and persistent modes are host features.

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

This is an independent adaptation, not an official Cursor or pstack release. [UPSTREAM](UPSTREAM) pins the source revision. Upstream changes are incorporated deliberately so they do not overwrite Hapstack's routing, user settings, or portable patcher/ship behavior. Existing personal skill installations remain separate until their owner chooses to migrate.

MIT licensed. [LICENSE](LICENSE) retains upstream copyright. [CREDITS.md](CREDITS.md) records the original authorship and adaptation. No private conversation, machine directory, credentials, or user configuration belongs in this repository.

