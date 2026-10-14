# Verify and ship

Verification checks the actual requested result. Use the relevant UI or CLI control surface and the smallest meaningful checks for the acceptance criteria and mandatory repository rules. A build, agent report, or mocked surface does not prove a live behavior works. Report gaps honestly.

A project-specific [verification skill](../../skills/create-verification-skill/SKILL.md) can record launch, drive, evidence, cleanup, and feature-map instructions. Create one when requested and maintain it when the app changes.

For delivery, hap-mode ship routes to [ship](../../skills/ship/SKILL.md). It resolves the actual remote and default branch, preserves unrelated changes, follows configured versioning and repository gates, handles PR/stack readiness, and verifies delivery before cleanup. Shipping does not imply deployment, registry publication, or notifications.

The retained [independent verification recipe](../../skills/hap-mode/playbooks/shipping.md) is available when independent verification is explicitly requested or required. It does not silently add an audit to ordinary shipping. On T3, register each PR and use app-owned watches for requested monitoring. Pending queues are not merged PRs.
