### Multi-phase or multi-PR plan

**You own the plan, not the code. The plan is a checklist an owner runs box by box and the operator audits from the evidence.** The plan is the deliverable. Do not implement.

1. When the change is one or two files with an obvious approach, skip the plan. Say so and stop.
2. Settle open questions by prototype before you write. Run `playbooks/prototype.md` for each. Keep the branch, the SHA, and the screenshots for Appendix A. Ask the operator only about a product or preference call that no run can settle. Give options (the [never-block-on-the-human](../references/principles/never-block-on-the-human.md) principle).
3. Explore in subagents with `subagent_type: "hap-agent"` and an explicit model per the Subagents section (the [guard-the-context-window](../references/principles/guard-the-context-window.md) principle). Each returns file pointers, conventions, test commands, and entry points. No inlined dumps.
4. Copy the skeleton below into the plan file and fill every placeholder. Unless the operator names a path, write the file under the agent store's `docs/`. Keep every heading and every sub-block in the order shown. One section per PR. One PR is one change with its own evidence (the [sequence-verifiable-units](../references/principles/sequence-verifiable-units.md) principle). Name the execution playbook in **How to read this**. Use `playbooks/full-send.md`. PRs the operator wants to review before landing run it as `full stop`.
5. Write under `/technical-writing` in full, then `/unslop`. The body is one Diátaxis mode, how-to. Appendices hold explanation and reference. Each heading states the task or the finding. No long dashes. No mid-sentence colons.
6. Resolve `HAP_MODE_DIR` through the runtime contract. Run `node "$HAP_MODE_DIR/scripts/check-plan.mjs" <plan.md>` and fix every line it prints (the [encode-lessons-in-structure](../references/principles/encode-lessons-in-structure.md) principle).
7. Hand back. Post the plan path and the script's output, then stop. Execution starts on the operator's explicit go, under the execution playbook the plan names.

**Verification.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked (the [prove-it-works](../references/principles/prove-it-works.md) principle). That sentence is the verification rule. Every verification block opens with it. The live block is mandatory. Each live box drives the real surface through its control skill with a concrete scenario and a pass predicate. One box is the **Regression against trunk.** It runs the same load-bearing scenario on trunk and head. If trunk does not have the feature, the box records that and gates the behavior the diff adds instead of inventing a trunk result. The perf gate names the metric, the probe run at trunk and head, the trunk baseline measured first, and the rule with the number that fails. If trunk lacks the feature, set an absolute budget instead of a ratio between unlike scenarios. A PR that changes an interaction is review-gated. The operator reviews it with screenshots and a video before merge. A PR that changes no interaction writes `**Review gate.** None. <PR id> is not review-gated.` and no boxes under it.

**Control skill.** Pick it by surface. Browser, Electron, and web UIs use `control-ui` bundled with Hapstack. CLIs and TUIs use `control-cli` bundled with Hapstack. Native mobile uses whatever simulator-driving skill the repo has. A PR that touches two surfaces gets live boxes on both. A surface with no control skill is a risk in Appendix C, and its live block still names how each box drives it.

````markdown
# <Program> plan

<Under ten lines. What changes, for whom, the rule the program enforces, and the PR ids in order.>

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `"$HAP_MODE_DIR/playbooks/<execution playbook>.md"` from the installed package. <Who merges, and which PR ids are the operator's items that stop at merge-ready.>

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Run the program

- [ ] State this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] Resolve `HAP_MODE_DIR` to the installed hap-mode directory through the runtime contract. Read these before the first PR.
  - [ ] `"$HAP_MODE_DIR/playbooks/<execution playbook>.md"`
  - [ ] `"$HAP_MODE_DIR/playbooks/opening-a-pr.md"`
  - [ ] `<resolved control skill path>`
- [ ] Run each PR through the execution playbook in dependency order. <PR id> and <PR id> are independent and first. <PR id> after <PR id>.
- [ ] Hold the file boundaries. <PR id or class> touches only `<glob>`.
- [ ] Hold the review gate. <PR ids> change an interaction and run as `full stop`.
- [ ] On the operator's hold, stop writing at once and report the state of each PR.

### PR mechanics, for every PR

- [ ] Resolve the forge from the actual delivery remote through the runtime contract.
- [ ] Open the PR ready, never draft, per `playbooks/opening-a-pr.md`. A stack child targets its parent branch.
- [ ] Run the repository's lint and typecheck before the PR-facing push. Push with hooks on.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every Bugbot and security-review comment per `../references/bugbot-triage.md`.
- [ ] Rebase onto current trunk before babysit. Rebase again only at merge prep, on a conflict with trunk, or on a CI failure caused by trunk.

## <Task as a verb phrase> (<PR id>)

**Depends on.** <PR id, or None.>

**Files.**

- [ ] Edit `<path>`.
- [ ] Create `<path>`.
- [ ] Delete `<path>`.

**Build.**

- [ ] <One change. Name the symbol and the file.>

**You see.**

- [ ] <One observable result, with the exact log line or screen state.>

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] <Test file and the case it gains.> Run `<command>`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Regression against trunk. Run <the same load-bearing scenario> at trunk and head through `<control skill>`. If trunk lacks the feature, record that and gate <the behavior the diff adds>. Save `<slug>.png`. Pass when <predicate>.
- [ ] <Scenario.> Save `<slug>.png`. Pass when <predicate>.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. <What is measured at both trunk and head. If trunk lacks the feature, also name the diff-added work and the end-to-end state the user waits for.>
- [ ] Probe. <The command or procedure, run at trunk and at the head, interleaved. Both sides must produce the metric.>
- [ ] Baseline. Record the trunk <value> first.
- [ ] Rule. <Head against trunk, with the number that fails. If the scenarios differ, add absolute budgets for the diff-added work and the user-visible end state instead of an invalid ratio.>

**Review gate.** The operator reviews before merge.

- [ ] Copy the live screenshots into `<media path>/<pr-id>-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the change. Save it as `<media path>/<pr-id>-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Merge gate from `playbooks/full-send.md` passes at the exact head SHA.
- [ ] <Merged through the ship skill, or merge-ready for the operator under `full stop`.>

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

<Each open question a prototype answered, with the branch, the SHA, and the artifact links. Each question that stays unproven.>

## Appendix B. Alternatives rejected

<Each approach weighed and why it lost.>

## Appendix C. Risks

<Each risk with the PR it lands in and what the owner watches.>

## Appendix D. Links and reading list

<Docs to read before editing. Which PRs get the **how** and **interrogate** skills. The trail per `skills/show-me-your-work/SKILL.md`.>
````

**Reply:** the plan path, the PR ids with their dependencies and the review-gated set, what the prototypes proved and what stays unproven, and the check script's output.
