---
name: architect
description: Sketch types, signatures, and module structure before code, then stay
  in the loop while implementation fills in. Use for /architect, 'architect this',
  'design this', or non-trivial work where jumping to code would lock in the wrong
  shape.
license: MIT
---

## Host integration

Read [the Hapstack runtime contract](../hap-mode/references/runtime.md) once per task before model selection, delegation, external actions, or scheduling. Its host mappings and authorization rules govern the host-specific steps below.


# Architect

Sketch types, function signatures, class shapes, and module boundaries with `not implemented` bodies and pseudocode. Synthesize across multiple model perspectives, then fill in code against the chosen sketch.

## Start

Open a todolist with one entry per phase before starting.

1. Ground
2. Sketch
3. Agree
4. Implement
5. Scrap

## Phase A: Ground the problem

Build a real mental model of every system the new code touches. Run the **how** skill over the relevant subsystems. Naming a file isn't grounding. Produce the architectural explanation `how` prescribes. If the design redefines ownership or layering, also run the **why** skill on the existing shape so the rationale becomes a constraint, not a guess.

Skip Phase A only when the work is genuinely greenfield with no surrounding system to integrate.

## Phase B: Sketch

Produce candidate sketches from the design-sketch task and the Phase A grounding artifacts, using `references/runner-prompt.md` as each runner's prompt.

1. **Frame.** Write 3 to 6 gradeable rubric criteria for this design. Runners see only the task, never the rubric.
2. **Fan out.** When delegation is allowed, spawn one runner per entry in the `architect runners` line of the resolved Hapstack configuration (default `inherit-parent`, `inherit-parent`), all in one message, each writing to its own output path. Resolve models against the live catalog per the runtime contract and report an unavailable one instead of guessing. Without delegation, draft the candidates yourself and say the comparison was not independent.
3. **Pick a base.** Read every candidate end to end and score it against the rubric criterion by criterion. Pick the base a future maintainer can extend most easily without breaking invariants. When two tie, prefer the smaller public surface.
4. **Graft.** Fold in the one or two ideas from each other candidate that earn their place, rewritten to fit the base's mental model, not pasted. If the candidates converge, note the agreement and keep the shared shape. If they diverge wildly, the framing was under-specified: reframe and rerun.

Design it twice. Require at least two structurally distinct candidates before synthesis, even when the first looks sufficient. This is the [exhaust-the-design-space](../hap-mode/references/principles/exhaust-the-design-space.md) principle made concrete. Whole-shape alternatives, not point fixes inside one shape.

Screen every candidate against [`references/design-red-flags.md`](references/design-red-flags.md) before synthesis. Assume the next contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Prefer the design where a change that looks right from one file is right for the whole repo.

Compare viable candidates on interface depth. Prefer the design that hides more complexity behind a smaller, simpler public surface. A rich interface can keep call chains short by concentrating capability instead of scattering it across layers.

The result is one synthesized design package. The base choice and grafts fill the rationale's "Synthesis decision" section.

## Phase C: Agree (opt-in)

Default: proceed directly to implementation with the synthesized design. No human checkpoint.

Opt in to a checkpoint when the invoker explicitly asks: "/architect with checkpoint," "stop and show me before implementing," or similar. Then surface the synthesized design and pause for sign-off.

The synthesis can ship as its own commit either way, as the "scaffold first" mode of the [foundational-thinking](../hap-mode/references/principles/foundational-thinking.md) principle. Planned and scoped breakage during fill-in is fine, per the [outcome-oriented-execution](../hap-mode/references/principles/outcome-oriented-execution.md) principle. For adversarial pressure on the design before implementing, run the **interrogate** skill on the synthesized sketch.

If the human pushes back on the shape (in a checkpoint or after the fact), treat that as Phase A evidence. Re-ground and re-run Phase B before writing more code.

## Phase D: Implement against the sketch

Replace `not implemented` bodies with code, pseudocode with logic. The synthesized sketch is the contract. Deviations from it are signal to surface, not friction to absorb silently. If a function needs a parameter the sketch didn't anticipate, ask whether the sketch was wrong, the requirement was missed, or the implementation is overreaching.

## Phase E: Scrap when the architecture is wrong

If implementation keeps producing friction the sketch can't absorb, throw the sketch out. Don't bolt fixes onto a wrong design, per the [redesign-from-first-principles](../hap-mode/references/principles/redesign-from-first-principles.md) and [fix-root-causes](../hap-mode/references/principles/fix-root-causes.md) principles.

The signal is a *pattern*, not single instances. Tells:

- The same shape of workaround appearing repeatedly across unrelated code.
- Multiple unrelated edge cases that all need special-case branches.
- Types that need escape hatches (`any`, casts, optional fields always set in practice) to compile.
- The "we need a lock" reflex when the sketch said the state wasn't shared.
- Callers having to know the abstraction's internal rules to use it.
- Two or more independent Phase D deviations of the same shape across the implementation.

Use judgment. A few edge cases don't condemn an architecture. Some problems are legitimately complex. Complexity in the data is not complexity in the design.

When you scrap:

1. Re-run the **how** skill over what's been built.
2. Redesign as if the new constraints had been day-one assumptions, per redesign-from-first-principles.
3. Subtract before adding, per the [subtract-before-you-add](../hap-mode/references/principles/subtract-before-you-add.md) principle. The new sketch should be smaller than the old one before it grows.
4. Return to Phase B and sketch again.

## Outputs

The caller's usage is written first and the type sketch derived from it. One file with new types and signatures for small changes. Module map plus type definitions for larger work. The rationale ships alongside, shaped per `references/rationale-template.md`, including the usage sketch and the synthesis decision.
