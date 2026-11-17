# Steer with principle names

hapstack ships 24 principles as individual skills. `/hap-mode` reads their index at the start of every multi-step task, applies the ones the task triggers, and names each applied principle in its reply along with the decision it changed.

You don't invoke principles. You use their names to steer. Each name points at a complete rule the agent has already read, so one phrase redirects the work more precisely than a paragraph of instructions.

## Steering in practice

Say the agent is about to bolt a new adapter onto three existing ones:

```text
use subtract before you add. delete the obsolete adapters first, then design what's left.
```

Say it claims success because the build passed:

```text
apply prove it works. run the real import flow and show me the written records.
```

Say two parallel attempts are about to write to the same branch:

```text
separate before serializing shared state. give each attempt its own worktree, no locks.
```

Each phrase lands because the rule behind it is specific. The agent still has to say, in its reply, which decision the rule changed. A principle citation with no decision behind it is the tell that it name-dropped instead of applying.

## The 24, briefly

The core principles decide how much to build and when to rethink the design:

- [Laziness Protocol](../../skills/hap-mode/references/principles/laziness-protocol.md) prefers deletion and the smallest change that solves the problem.
- [Foundational Thinking](../../skills/hap-mode/references/principles/foundational-thinking.md) chooses the core data structures before writing logic.
- [Redesign from First Principles](../../skills/hap-mode/references/principles/redesign-from-first-principles.md) integrates a new requirement as if it had been there from day one.
- [Attack the Premise](../../skills/hap-mode/references/principles/attack-the-premise.md) questions the premise that two or more failed fixes shared, after a census of which actors hold the imbalance.
- [Subtract Before You Add](../../skills/hap-mode/references/principles/subtract-before-you-add.md) removes dead weight before building on top of it.
- [Minimize Reader Load](../../skills/hap-mode/references/principles/minimize-reader-load.md) collapses layers and hidden state a reader must hold in their head.
- [Outcome-Oriented Execution](../../skills/hap-mode/references/principles/outcome-oriented-execution.md) converges rewrites on the target design instead of preserving throwaway compatibility states.
- [Experience First](../../skills/hap-mode/references/principles/experience-first.md) chooses the user's result over implementation convenience.
- [Exhaust the Design Space](../../skills/hap-mode/references/principles/exhaust-the-design-space.md) builds two or three competing prototypes when there's no precedent.
- [Build the Lever](../../skills/hap-mode/references/principles/build-the-lever.md) builds the script that does or proves the work, so a reviewer can rerun it. When an agent keeps doing the same thing by hand, have it write the tool or skill it wishes it had. If a script can do a step the same way every time, use the script, and save agents for the judgment calls.

The architecture principles decide where state, validation, and compatibility live:

- [Model the Domain](../../skills/hap-mode/references/principles/model-the-domain.md) encodes repeated rules in one structure, not scattered conditionals.
- [Boundary Discipline](../../skills/hap-mode/references/principles/boundary-discipline.md) validates at the boundary and trusts internal types.
- [Type System Discipline](../../skills/hap-mode/references/principles/type-system-discipline.md) makes illegal states unrepresentable.
- [Make Operations Idempotent](../../skills/hap-mode/references/principles/make-operations-idempotent.md) converges retries on the same end state.
- [Migrate Callers Then Delete Legacy APIs](../../skills/hap-mode/references/principles/migrate-callers-then-delete-legacy-apis.md) migrates and deletes in one wave.
- [Separate Before Serializing Shared State](../../skills/hap-mode/references/principles/separate-before-serializing-shared-state.md) removes the sharing before adding coordination.

The verification principles define what counts as proof:

- [Prove It Works](../../skills/hap-mode/references/principles/prove-it-works.md) verifies the real artifact, not a proxy.
- [Fix Root Causes](../../skills/hap-mode/references/principles/fix-root-causes.md) reproduces and traces to the cause before changing code.
- [Sequence Work into Verifiable Units](../../skills/hap-mode/references/principles/sequence-verifiable-units.md) ends each small unit in a check before starting the next.
- [Test Behavior, Not Implementation](../../skills/hap-mode/references/principles/test-behavior-not-implementation.md) calls the code the way its users do and asserts a literal expected value, and deletes a test that would still pass if every imported function returned `undefined`.
- [Explain the Number](../../skills/hap-mode/references/principles/explain-the-number.md) names what limits a measured number and rules out that it measured something else, before anyone trusts or reports it. [`/benchmark-checklist`](../../skills/benchmark-checklist/SKILL.md) turns it into seven questions you answer from real runs.

The delegation principles keep parallel work sane:

- [Guard the Context Window](../../skills/hap-mode/references/principles/guard-the-context-window.md) routes bulk reading to subagents and keeps findings in the main chat.
- [Never Block on the Human](../../skills/hap-mode/references/principles/never-block-on-the-human.md) proceeds on reversible work and presents the result.

And one meta principle:

- [Encode Lessons in Structure](../../skills/hap-mode/references/principles/encode-lessons-in-structure.md) turns advice you've repeated twice into a lint, check, or script. [`/correct`](../../skills/correct/SKILL.md) applies it to a whole repo, as shown in [Make it yours](./09-make-it-yours.md#fix-the-environment-with-correct).

Don't memorize the list. Skim it now, then come back when you catch the agent doing something a name here would have prevented. That's how the vocabulary sticks.

Next: [Make it yours](./09-make-it-yours.md).
