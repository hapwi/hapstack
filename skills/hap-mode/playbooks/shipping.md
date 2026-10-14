### Shipping with independent verification

This retained workflow is selected only for an explicit independent-verification request or a concrete repository requirement. Ordinary `hap-mode ship` routes directly to the bundled ship skill.

1. Read the runtime contract and ship skill. Resolve the target remote, PRs, stack dependencies, and exact inspected heads using ship's discovery rules.
2. If independent verification is authorized and available, run scoped verifiers using configured roles and actual affected surfaces. One result records its PR/head, evidence, and PASS/PASS+NOTES/FAIL. A local self-check is not independent verification. Prepare verdicts locally unless posting them was authorized.
3. Inspect the verifier artifacts and any disagreements. Apply the patch-id rule below before reusing evidence at a changed head or base. Respect the user's check limits; do not invent a ten-lane audit or performance test for every change. A required independent verdict that cannot run is a blocker, not permission to claim success.
4. Deliver only the requested verified work through ship's versioning, readiness, merge, and cleanup process. Keep unverified dependents out of the shipment and preserve their branches.
5. Use the runtime's host PR watcher for pending checks/queues. On T3 arm watch_pull_request and return; do not start a second polling loop. Report actual merged versus pending state.

**Reply:** the selected work, independent evidence if requested, shipped version when applicable, delivered PRs/commits, and remaining blockers.

## Patch-id rule

Adapted from step 3 of Lauren Tan's [pinned pstack shipping playbook](https://github.com/cursor/plugins/blob/5108b719a7aa484ef1a9781f587c7bbeac793f92/pstack/skills/poteto-mode/playbooks/shipping.md). The base-change safeguard below is a Hapstack addition.

Record each verdict's head SHA, base SHA, stable patch-id from `git diff <base> <head> | git patch-id --stable`, and the builds each lane exercised. After a rebase or base retarget, compare the current base-to-head patch-id with the recorded value.

If patch-ids match, the diff review can remain valid. Recheck mergeability and CI at the current head. A changed patch needs fresh verification except for a lane whose build equivalence is established below. Matching commit messages or checks from an older head do not establish validity.

For changes confined to tests, docs, or lint configuration, build each lane's artifact twice at the verdict head and once at the current head. Inspect every difference. Differences present between the original builds, or embedded commit SHAs, can be documented as noise. Reuse that lane only when the remaining outputs match; review the changed files and run checks afresh. A lane using a dev server or lacking build output must rerun.

For base changes, patch-id alone cannot preserve behavioral evidence. Inspect the base delta for changed application paths, their dependencies, and build or CI configuration. If relevant paths changed or their impact cannot be established, rerun the affected behavioral, regression, and performance lanes against the current base and head. A clean merge does not prove behavior is unchanged. Record which results remain valid and which were rerun before reporting the current head verified. Follow user check limits; required evidence that cannot be produced remains a blocker.
