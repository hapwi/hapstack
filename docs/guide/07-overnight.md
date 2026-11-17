# Long and unattended work

A long-run request should name the project, scope, completion condition, allowed effects, and stopping conditions. Hapstack can continue authorized work, keep a decision trail, and select the autonomous-run or Full send playbook. `full send` takes one change to a merged PR while you are away; `full stop` leaves the merge to you. A vague instruction to keep going does not expand external authority or override a concrete approval gate.

Active continuation is different from persistent scheduling. Use the host's documented scheduler for explicitly requested recurring jobs. On T3, schedule_task accepts structured interval, fixed-time, or webhook triggers. Retain task IDs, avoid duplicate jobs, and include request data through supported prompt placeholders.

If delegation or scheduling is unavailable, disclose the limit. Never claim an agent is working from a recent transcript timestamp alone. Use status APIs and actual artifacts. Record enough context to pause and resume safely; do not leave polling loops beside app-owned PR watchers.

See [autonomous-run](../../skills/hap-mode/playbooks/autonomous-run.md), [full-send](../../skills/hap-mode/playbooks/full-send.md), [show-me-your-work](../../skills/show-me-your-work/SKILL.md), and [runtime](../../skills/hap-mode/references/runtime.md).
