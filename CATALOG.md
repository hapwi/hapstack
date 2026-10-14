# Hapstack catalogue

## Ordinary skills

- [architect](skills/architect/SKILL.md). Sketch types, signatures, and module structure before code, then stay in the loop while implementation fills in. Use for /architect, 'architect this', 'design this', or non-trivial work where jumping to code would lock in the wrong shape.
- [arena](skills/arena/SKILL.md). Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape.
- [automate-me](skills/automate-me/SKILL.md). Use for "automate me", "create/update/refresh my -mode skill", "turn/capture my preferences or working style into a skill", or wanting agents to follow how the user works. Drafts or revises a personal -mode skill via create-skill + unslop, optionally pulling fresh evidence from recent transcripts.
- [benchmark-checklist](skills/benchmark-checklist/SKILL.md). Vet a perf measurement (limiter, tuning, limits, errors, repeatability, relevance, and whether the work happened) before you report or act on it. Use when you run a benchmark or report a speedup or regression you measured.
- [blast-radius](skills/blast-radius/SKILL.md). Find what a change could break somewhere else before it ships, beyond the diff, and prove the one fact it's safe because of by running real code instead of writing it up. Use for 'blast radius of X', 'what could this break', or reviewing a small diff you don't trust.
- [bro](skills/bro/SKILL.md). Restate the last message in plain human language, with no jargon.
- [control-cli](skills/control-cli/SKILL.md). Exercise a requested CLI or terminal UI through the current host’s shell and PTY controls, recording actual behavior and preserving unrelated files and processes.
- [control-ui](skills/control-ui/SKILL.md). Drive and inspect a requested UI using the active host’s browser or desktop controls, collecting evidence from the actual affected surface.
- [correct](skills/correct/SKILL.md). Find the mistakes agents keep repeating in this repo and make each one impossible. Try architecture first, then types, then a lint whose error names the fix, then a test, and write docs last. Prove each check fails on a real past mistake. Repeat this each time the operator corrects you. Use for /correct.
- [create-verification-skill](skills/create-verification-skill/SKILL.md). Generate a project-local verification skill that drives your app the way a user does — any language, framework, or platform. Use for /create-verification-skill, "make a control skill for this repo", or when a project has no scripted way to prove UI/CLI/service behavior.
- [deslop](skills/deslop/SKILL.md). Remove AI-generated code slop and clean up code style
- [figure-it-out](skills/figure-it-out/SKILL.md). Design an auditable playbook when no narrower one fits: a large migration, an ambitious multi-part change, or work a human reviews after stepping away. Scales rigor to the task, runs a hypothesis loop, and logs decisions. Use for /figure-it-out or 'figure it out'.
- [hap-help](skills/hap-help/SKILL.md). Explain Hapstack setup, hap-mode routing, skills, playbooks, principles, prerequisites, and host-specific invocation. Use for hap-help or questions about using Hapstack.
- [hap-mode](skills/hap-mode/SKILL.md). Route requested Hapstack engineering tasks to playbooks and skills, including patch-to-score and shipping. Use for hap-mode or explicit Hapstack mode requests.
- [how](skills/how/SKILL.md). Use for "how does X work", code walkthroughs before changing something, and placement / ownership / layering questions ("where should this live", "which package owns this", "is this the right layer"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation.
- [in-your-own-words](skills/in-your-own-words/SKILL.md). Restate in your own words what you think the user's goals are and what problem they're trying to solve. Use for /in-your-own-words.
- [interrogate](skills/interrogate/SKILL.md). Use for "interrogate", "adversarial review", "multi-model review", "challenge this", "stress test this code", "find blind spots", or "tear this apart". Multiple LLM reviewers challenge changes from independent angles.
- [ketchup](skills/ketchup/SKILL.md). Catch the user up on what changed in this chat since their last message, in a few plain sentences and small visuals. Give each action item just enough context to make the call. Use for /ketchup.
- [maintain-verification-skill](skills/maintain-verification-skill/SKILL.md). Periodic pass that keeps a project's verification skill and feature map honest: parallel source readers per feature, one live session driving every feature, at most one PR of proven corrections. Use for /maintain-verification-skill or "audit the verify skill".
- [make-bot-ui](skills/make-bot-ui/SKILL.md). Build a UI whose authenticated server actions wake an authorized agent workflow through a supported webhook scheduler, keeping credentials and webhook URLs out of the browser and public sources.
- [no-comments](skills/no-comments/SKILL.md). Review unnecessary comments in the current diff by default, or in explicitly named files or the whole project. Fix accepted findings and offer constraint encodings.
- [patcher](skills/patcher/SKILL.md). Run React Doctor and configured shadcn lint diagnostics, with an optional Improve audit, local implementation plans, and tracked fixes. Use when the user invokes patcher or patcher improve, asks for React Doctor review or fixes, or requests a React Doctor score such as 100/100.
- [recall](skills/recall/SKILL.md). Reconstruct your recent working context from your own chat history, live state, and the shared record (user reports, prior fixes, incidents), then hand back a tight current-state brief. Use for 'recall my work on X', 'catch me up', 'what have I been working on', 'where did I leave off', before starting or resuming work.
- [reflect](skills/reflect/SKILL.md). Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
- [setup-hapstack](skills/setup-hapstack/SKILL.md). Configure Hapstack model roles, reasoning budget, delegation, tooling, and shipping preferences for the current operator. Use for setup-hapstack or changing Hapstack settings.
- [ship](skills/ship/SKILL.md). Ship PRs or scoped local work to the configured Git remote’s default branch following the project’s versioning policy and updating an existing changelog. Handle "release this" using the project’s existing release process, without assuming tags or GitHub releases. Clean up safely merged PR branches; deployment is separate.
- [show-me-your-work](skills/show-me-your-work/SKILL.md). Keep a reviewable decision trail for long-running or unattended work: a TSV log with one row per decision (what, why, evidence, result). Local by default; commit it when a reviewer needs the trail to trust the result. Use for /show-me-your-work, autonomous or multi-phase runs, or work a human reviews after stepping away.
- [swarm](skills/swarm/SKILL.md). Fan out N parallel workers, drain them, and return one report. Use for /swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration.
- [tdd](skills/tdd/SKILL.md). Use only when the user explicitly asks for TDD, a failing test, or a regression test, OR when the bug has an obvious cheap local test target. Skip when the test path is unclear, expensive, integration-heavy, or not requested.
- [teach](skills/teach/SKILL.md). Explain a body of work plainly so a person actually understands it. Runs the `how` and `why` skills and weaves what they find into one clear explanation. Use for 'teach me this', 'help me really understand X', 'explain this change or subsystem to me'.
- [technical-writing](skills/technical-writing/SKILL.md). Layered technical-writing standard: Diátaxis structure, Google developer style sentences, STE instruction rules, Global English syntax. Use for /technical-writing or when writing or reviewing docs, RFCs, readmes, PR descriptions, or commit messages.
- [typescript-best-practices](skills/typescript-best-practices/SKILL.md). TypeScript best practices. Use when reading or editing any .ts or .tsx file.
- [unslop](skills/unslop/SKILL.md). Cut AI tells from any writing.
- [why](skills/why/SKILL.md). Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, postmortems, or data-backed thresholds. Discovers available MCPs and queries each evidence category (source control, issue tracker, long-form docs, real-time chat, infrastructure observability, error tracking, product analytics warehouse) in parallel, then returns a cited read on decisions and tradeoffs. Use how for runtime behavior.

## Engineering principles

- [attack-the-premise](skills/principle-attack-the-premise/SKILL.md). Apply when two or more fixes that share one premise have failed the same gate. Take a census of which actors hold the imbalance before the next fix, then question the premise instead of writing another fix that assumes it.
- [boundary-discipline](skills/principle-boundary-discipline/SKILL.md). Apply when wiring validation, error handling, or framework adapters. Concentrate guards at system boundaries (CLI, config, network, external APIs); trust internal types and keep business logic in pure functions.
- [build-the-lever](skills/principle-build-the-lever/SKILL.md). Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, generator, or a skill your subagents follow) instead of working by hand. The tool is the artifact a reviewer can rerun.
- [encode-lessons-in-structure](skills/principle-encode-lessons-in-structure/SKILL.md). Apply when you catch yourself writing the same instruction a second time, or notice a recurring correction. Encode the rule as a lint, metadata flag, runtime check, or script instead of more text.
- [exhaust-the-design-space](skills/principle-exhaust-the-design-space/SKILL.md). Apply when facing a novel UI interaction or architectural decision with no precedent in the codebase. Build 2-3 competing prototypes and compare side by side before committing.
- [experience-first](skills/principle-experience-first/SKILL.md). Apply when product, UX, or feature-scope tradeoffs come up. Choose user delight over implementation convenience; ship fewer polished features over more rough ones.
- [explain-the-number](skills/principle-explain-the-number/SKILL.md). Apply before you trust, report, or act on a number you measured: a speedup, a regression, a throughput, a latency, or an eval result. Find what limits it, and rule out that it measured something other than the work you think.
- [fix-root-causes](skills/principle-fix-root-causes/SKILL.md). Apply when debugging. Trace each symptom to its root cause and fix it there; reproduce first, ask why until you reach it, resist nil-check guards that silence crashes.
- [foundational-thinking](skills/principle-foundational-thinking/SKILL.md). Apply before writing logic: choosing core types and data structures, sequencing scaffold-vs-feature work, asking what concurrent actors share. Get the data structures right so downstream code becomes obvious.
- [guard-the-context-window](skills/principle-guard-the-context-window/SKILL.md). Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main thread, not raw payloads.
- [laziness-protocol](skills/principle-laziness-protocol/SKILL.md). Apply when refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest change that solves the problem.
- [make-operations-idempotent](skills/principle-make-operations-idempotent/SKILL.md). Apply when designing commands, lifecycle steps, or processing loops that run amid crashes, restarts, and retries. Converge to the same end state regardless of partial prior runs.
- [migrate-callers-then-delete-legacy-apis](skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md). Apply when introducing a new internal API while old callers still exist. Migrate callers and delete the old API in the same wave instead of preserving compatibility layers.
- [minimize-reader-load](skills/principle-minimize-reader-load/SKILL.md). Apply when reviewing or shaping code that's hard to trace. Count layers between question and answer, and hidden state in the reader's head; collapse one-caller wrappers and shrink mutable scope.
- [model-the-domain](skills/principle-model-the-domain/SKILL.md). Apply when writing stateful logic, or when code branches a lot or repeats a shape assumption across files.
- [never-block-on-the-human](skills/principle-never-block-on-the-human/SKILL.md). Apply when tempted to ask 'should I do X?' on reversible work.
- [outcome-oriented-execution](skills/principle-outcome-oriented-execution/SKILL.md). Apply during planned rewrites and migrations with explicit phase boundaries. Converge on the target architecture; don't preserve smooth intermediate states with throwaway compatibility code.
- [prove-it-works](skills/principle-prove-it-works/SKILL.md). Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.'
- [redesign-from-first-principles](skills/principle-redesign-from-first-principles/SKILL.md). Apply when integrating a new requirement into an existing design.
- [separate-before-serializing-shared-state](skills/principle-separate-before-serializing-shared-state/SKILL.md). Apply when concurrent actors might write to the same file, branch, key, or state object. Eliminate the sharing first; serialize structurally only when one shared writer is a real invariant.
- [sequence-verifiable-units](skills/principle-sequence-verifiable-units/SKILL.md). Apply to multi-step work (sweeps, migrations, runs of similar edits) and to how you stack commits and PRs. Break work into small units that each end in a verifiable state, check each before the next, and order delivery so the sequence proves itself to a reviewer.
- [subtract-before-you-add](skills/principle-subtract-before-you-add/SKILL.md). Apply when sequencing an addition, refactor, or rewrite. Remove dead code, redundant validators, and stub references first, then build on the simpler base.
- [test-behavior-not-implementation](skills/principle-test-behavior-not-implementation/SKILL.md). Apply when you write, change, or keep a test. Call the code as its users do and assert the exact result they see. Rewrite or delete a test that would pass if every imported function returned undefined.
- [type-system-discipline](skills/principle-type-system-discipline/SKILL.md). Apply when designing types, reviewing a function signature, or writing code in any statically-typed language. Make illegal states unrepresentable, brand semantic primitives, parse external data at boundaries, refuse to lie to the compiler, exhaust variants, derive from authoritative schemas.

## Playbooks

These 23 recipes live under hap-mode. User/repository limits and the runtime contract govern host operations. Ordinary patching and shipping route to patcher/ship.

- [authoring-a-skill](skills/hap-mode/playbooks/authoring-a-skill.md)
- [autonomous-run](skills/hap-mode/playbooks/autonomous-run.md)
- [autopilot-full](skills/hap-mode/playbooks/autopilot-full.md)
- [autopilot-stack](skills/hap-mode/playbooks/autopilot-stack.md)
- [babysit](skills/hap-mode/playbooks/babysit.md)
- [bug-fix](skills/hap-mode/playbooks/bug-fix.md)
- [eval](skills/hap-mode/playbooks/eval.md)
- [feature](skills/hap-mode/playbooks/feature.md)
- [hillclimb](skills/hap-mode/playbooks/hillclimb.md)
- [investigation](skills/hap-mode/playbooks/investigation.md)
- [multi-phase-plan](skills/hap-mode/playbooks/multi-phase-plan.md)
- [opening-a-pr](skills/hap-mode/playbooks/opening-a-pr.md)
- [orchestrate](skills/hap-mode/playbooks/orchestrate.md)
- [pause-safely](skills/hap-mode/playbooks/pause-safely.md)
- [perf-issue](skills/hap-mode/playbooks/perf-issue.md)
- [prototype](skills/hap-mode/playbooks/prototype.md)
- [refactoring](skills/hap-mode/playbooks/refactoring.md)
- [runtime-forensics](skills/hap-mode/playbooks/runtime-forensics.md)
- [session-pickup](skills/hap-mode/playbooks/session-pickup.md)
- [shipping](skills/hap-mode/playbooks/shipping.md)
- [trace-forensics](skills/hap-mode/playbooks/trace-forensics.md)
- [visual-parity](skills/hap-mode/playbooks/visual-parity.md)
- [worktree-cleanup](skills/hap-mode/playbooks/worktree-cleanup.md)
