# Use hap-mode

Hap mode reads your request and selects a workflow. In Codex write $hap-mode; on another host use its supported slash or plugin-qualified form. A persistent custom mode is an optional host feature. Invoke the mode for each new task unless the host supports and the user selects persistence.

Patch-to-score routes to [patcher](../../skills/patcher/SKILL.md). Shipping and release requests route to [ship](../../skills/ship/SKILL.md). A combined patch-to-100-then-ship request completes patcher first and ships only if its acceptance criteria succeed.

Other work selects one of the retained playbooks, uses relevant principles, and calls supporting skills when needed. The runtime contract and explicit user/repository constraints govern delegation, checks, external actions, and unavailable tools. A workflow is agent guidance, not a guarantee that an API or surface exists.

Read [hap-mode](../../skills/hap-mode/SKILL.md) for the routes and complete principles index. Use hap-help for questions rather than triggering work merely to learn how it behaves.
