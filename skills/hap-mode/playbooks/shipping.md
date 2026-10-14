### Shipping with independent verification

This retained workflow is selected only for an explicit independent-verification request or a concrete repository requirement. Ordinary `hap-mode ship` routes directly to the bundled ship skill.

1. Read the runtime contract and ship skill. Resolve the target remote, PRs, stack dependencies, and exact inspected heads using ship's discovery rules.
2. If independent verification is authorized and available, run scoped verifiers using configured roles and actual affected surfaces. One result records its PR/head, evidence, and PASS/PASS+NOTES/FAIL. A local self-check is not independent verification. Prepare verdicts locally unless posting them was authorized.
3. Inspect the verifier artifacts and any disagreements. Respect the user's check limits; do not invent a ten-lane audit or performance test for every change. A required independent verdict that cannot run is a blocker, not permission to claim success.
4. Deliver only the requested verified work through ship's versioning, readiness, merge, and cleanup process. Keep unverified dependents out of the shipment and preserve their branches.
5. Use the runtime's host PR watcher for pending checks/queues. On T3 arm watch_pull_request and return; do not start a second polling loop. Report actual merged versus pending state.

**Reply:** the selected work, independent evidence if requested, shipped version when applicable, delivered PRs/commits, and remaining blockers.
