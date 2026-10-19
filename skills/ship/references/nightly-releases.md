# Optional nightly releases

Read this when project configuration enables `nightly: true`. The shared ship flow still owns scope, remote/provider selection, stacks, inspected-head readiness, required checks, version choice, changelog tracking, and safe cleanup. Nightly support adds publication and promotion steps only where the project has actual infrastructure and authority.

## Inspect the project workflow

Inspect existing CI/release workflows, branch conventions, version scripts, published candidate metadata, and supported host tools before acting. Identify the integration branch, publication destinations, stable promotion inputs, and which automation owns each version, tag, changelog, and release step. Use real available capabilities. Do not copy another project's updater, registry publishing, services, branch names, or cron cadence.

If infrastructure is absent or cannot preserve candidate provenance, explain the gap and prepare concrete scoped workflow/configuration changes for the actual project. Obtain missing setup or publication authority before activation. Do not silently fall back to a conventional stable release or claim channels exist. Ordinary authorized development delivery can continue independently.

Selecting `nightly: true` alone does not install infrastructure, create CI jobs, activate schedules, publish a prerelease, tag a commit, deploy, publish registry packages, or send messages. Inspect the effects of dispatching an existing workflow before running it. Existing workflows and action-specific user authority govern publication and its side effects.

## Separate development, nightly, and stable

- Development changes merge into the project's integration branch, normally its actual default branch. A development branch push or CI build artifact is not a published nightly or stable release. Keep stable versions unchanged and accumulate changes under Unreleased. Do not ask for a release version for these operations.
- Nightlies build an exact integration-branch commit, not merges into a dedicated nightly branch. A real published nightly has a unique prerelease version and discoverable publication record tied to its full source SHA. Use the project's established suffix, such as `X.Y.Z-nightly.<date>.<run>`, and keep it distinct from stable/latest publication. Do not commit stable version bumps back to the integration branch for a nightly. A proposed stable base version still needs the user's choice if the workflow does not already establish it.
- Stable release explicitly promotes an exact tested, published nightly candidate commit. Resolve and record the candidate before acting. Follow the user's target stable version or obtain the version choice through the shared flow. Never substitute moving integration-branch HEAD for the selected candidate, even when new development merges have landed.

For stable promotion, record the candidate's publication URL or ID, prerelease version, immutable full source SHA, relevant workflow run/artifact identity, and evidence of testing that candidate. Required CI checks and user acceptance testing are distinct evidence. Publication alone does not prove testing. If the project's required testing evidence is missing, report the gap and obtain it before promotion. Never invent a test result.

Verify the publication and tag resolve to the recorded SHA, that the candidate belongs to the intended project/integration history, and that the evidence applies to that candidate. Use the workflow's supported exact-candidate input or equivalent immutable precondition. If it resolves "latest nightly" at execution time, establish that it selects the tested SHA and cannot publish a different candidate during a race. Otherwise prepare a scoped fix and stop promotion. Verify the resulting stable release points to that same SHA. A supported rebuild with stable version metadata must retain that source provenance and pass the established release gates.

## Keep one owner for release tracking

Versioning preferences remain independent of nightly support. `project` follows the established policy; `release-only` defers stable version changes until an explicit release; `bump-on-ship` prepares one version for the stable shipment. Development merges and nightly builds are not stable shipments and must not cause competing stable bumps.

Keep shared changelog tracking throughout and follow [ship's public-facing content rule](../SKILL.md#write-public-facing-changelogs) for changelogs and release notes. Leave development changes under Unreleased. At stable release, include only the changes present in the chosen candidate, leaving later integration changes under Unreleased. Use the existing stable tracking/finalization mechanism without changing the candidate's source commit. If that mechanism cannot record the chosen version and changelog while preserving provenance, prepare the needed setup before publication.

When automation owns versioning or finalization, supply the chosen version through its supported inputs and verify the result. Do not also bump locally. A post-publication tracking commit on the integration branch may record the stable version and changelog, but it is not the candidate release commit. Report both SHAs when they differ. If a configured policy conflicts with the existing workflow, resolve the ownership conflict before release mutations.

## Resume without duplicating publication

Before dispatch or retry, inspect existing runs, candidate records, tags, and stable releases for the intended version and SHA. Reuse matching completed steps and resume the missing ones through supported tooling. A version or tag pointing elsewhere is a conflict, not permission to move it. Recheck provenance and readiness after any input or head change. Follow the shared bounded retry rules. Report publication, tracking, and cleanup separately on partial failure.

## Source

The candidate-promotion design is informed by pingdotgg/T3 Code's official [release operations](https://github.com/pingdotgg/t3code/blob/9077e818d836ec6e9cc373d7469034cccc593a5a/docs/operations/release.md) and [release workflow](https://github.com/pingdotgg/t3code/blob/9077e818d836ec6e9cc373d7469034cccc593a5a/.github/workflows/release.yml), inspected at revision `9077e818d836ec6e9cc373d7469034cccc593a5a`. These explain the design; they are not a live runtime dependency or a template to install wholesale.
