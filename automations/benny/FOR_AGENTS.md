# Configure Benny for a project

Read [setup-benny](skills/setup-benny/SKILL.md) and the Hapstack runtime contract. The intended program has two cooperating jobs: triage reports in a selected issue channel, and reproduce confirmed bugs using the project's actual control surface. Do not activate either job merely by reading or installing this pack.

Ask only for missing material choices: target project, source channel, permitted posts, issue tracker actions, routing, feature map, control skill, cadence, and available model roles. Never reuse another operator's channel IDs, paths, or credentials. Preserve any existing configuration.

Copy source-managed files into the selected project's .agent-workflow/automations/benny/ only when setup is requested, preserving destination-only files and resolving conflicting local edits. Keep user settings outside that copied pack. The jobs read their committed operational instruction files by stable project-relative paths; no plugin-cache path belongs in a scheduled prompt.

Use the selected host's scheduler with explicit authority for job creation/updates and channel writes. On T3, persistent jobs use schedule_task, not a private built-in automate command. Inspect existing jobs to prevent duplicates. A fresh scheduled checkout must have the required skills and referenced source files available; a configuration file present only in the current chat is not enough.

