# Improve: audit, plan, and fix locally

This mode draws on the evidence-based audit and planning approach of [shadcn/improve](https://github.com/shadcn/improve). It uses patcher's same-agent, current-working-directory workflow. Do not invoke the upstream skill or inherit its delegated execution rules. No installation or additional dependency is required.

## Audit and track findings

1. Reuse patcher's stack discovery when available. Otherwise read repository instructions, relevant configuration and intent documents, and the code needed for the requested scope. Improve can inspect non-React code; skip React-specific diagnostics where inapplicable. Do not run tooling setup or a full diagnostic suite merely to perform this audit.
2. Audit the actual files on disk, including staged, unstaged, and relevant untracked source. For changed-file scope, include local edits and relevant callers as well as the requested branch diff; distinguish introduced problems from pre-existing ones. Do not treat HEAD alone as the current state.
3. Default to correctness, security, performance, and meaningful test gaps in critical paths and likely hotspots. Look for concrete failures such as missing authorization, async races, incorrect boundary handling, repeated queries, or untested risky mutations. Broader architecture, dependency migrations, tooling, docs, and product direction require an explicit request. Honor narrower scope and state what was not audited.
4. Verify each finding against the source and documented intent. Deduplicate existing plans and diagnostic findings; do not relabel intentional tradeoffs as bugs. Reference secret locations and types without reproducing values. Reject speculative cleanup and cosmetic preferences. Lower-confidence concerns remain investigations, not confirmed defects.
5. Present stable numbered findings with category, file-and-line evidence, concrete impact, confidence, fix effort/risk, and a short fix sketch. Prioritize impact relative to effort, confidence, and risk. Keep the findings separate from React Doctor's score; neither a score of 100 nor an empty audit proves the absence of defects.

Store a concise local index at `plans/patcher-improve/README.md`, creating it on the first audit. If that location belongs to unrelated work, choose a non-conflicting location and report it. Reuse the established location on later runs. The index records scope, stable IDs, finding summaries/evidence, status, plan links, dependencies, and verification results or blockers. Start findings as FINDING; do not renumber or duplicate them on subsequent audits. Record rejected findings with a brief reason to avoid repeatedly proposing the same work.

After presenting findings, ask which to plan. Audit authorization permits the index but not application edits. Do not automatically create detailed plans for every finding.

## Create reviewable plans

`plan 1–4` creates one local Markdown plan per selected finding, such as `001-fix-order-query.md`, and marks it PLANNED. A request to plan does not authorize implementation. Plans should be understandable in a later session without relying on this conversation and contain:

- Finding ID, evidence, impact, and intended behavior.
- Exact files in scope, relevant existing patterns, and explicit exclusions.
- A baseline: current commit if available, existing local edits in scope, and focused current-code excerpts or file fingerprints. A commit stamp alone cannot describe uncommitted work. Never store secrets in excerpts.
- Ordered implementation steps and dependencies on other selected plans.
- Completion criteria and the smallest meaningful verification commands with expected results, following repository requirements and the user's validation policy. Distinguish proposed commands from checks actually run; do not mandate new tests or a full suite for every change.
- Material decisions, stop conditions, and a status/result section.

Present plan links and the recommended order for review. Keep plans proportional to the change. Do not require a separate planning agent or handoff.

## Execute selected plans

`fix 1–4` or `improve 1–4` authorizes implementation of those existing finding IDs. If they lack plans, create the plans first and continue without requiring a second approval for the same requested fixes. If IDs are missing or ambiguous, resolve the selection before dependent edits. `fix until done` executes the previously selected set; when no narrower selection exists, it selects all findings in the latest reviewed list. If no findings have been presented, audit and present them first rather than treating that phrase as permission for unlimited improvements.

1. Read each selected plan and its relevant files before editing. Compare against the recorded local baseline; refresh stale plans against the actual current code. Continue for routine drift, but ask if the changed state creates a material scope or product decision. Preserve user edits and do not overwrite concurrent changes.
2. Execute in dependency order with the same agent on the current branch. Mark IN PROGRESS, make focused fixes, and run only the necessary verification from the plan. Do not run the React Doctor “until 100” loop unless that workflow was also selected.
3. Mark DONE only when completion criteria are met and required checks pass. Record what changed and the actual checks/results in the plan and index. Explicitly identify any unperformed verification. A user request to mark something done still requires checking its criteria; already-fixed findings can be closed with that evidence.
4. Mark BLOCKED with a concrete reason when a required check cannot run, a dependency is unresolved, progress stalls, or a material decision is missing. Ask only for the missing decision and continue independent selected work. Do not silently add unselected dependencies, migrations, tooling installation, production writes, or broader refactors to the scope.
5. Stop when the selected set is done or blocked. Record newly discovered issues separately without automatically adding them to the current fix loop. Report completed IDs, blocked IDs, local plan location, checks performed, and remaining limitations.

## Resume and status

`improve status` reads the index and reports FINDING, PLANNED, IN PROGRESS, DONE, BLOCKED, and REJECTED items without starting another audit or running checks. Label results as recorded status if not reverified.

On a subsequent audit or execution request, reconcile relevant existing entries against current source before creating duplicates or acting on stale plans. Close independently resolved findings only with supporting evidence, reopen regressed ones, and refresh changed plans while preserving IDs. Revisit blocked work when its blocking condition changes; do not repeatedly run the same failing approach. Do not reverify every completed plan or run a general suite just to resume work.
