### Full send

**The user is not watching. You own the change from its current state to a merged PR, and your report is read long after you stop.** Adapted from tstack's `full-send` and `full-stop` (see CREDITS).

Run this only when the user clearly said `full send` or `full stop`. Any other wording keeps the normal autonomy rules. `full stop` runs every step except the merge and ends at merge-ready.

**The grant.** A `full send` request permits you to:

- Merge the PR through the bundled [ship skill](../../ship/SKILL.md) once the merge gate passes. `full stop` withholds this.
- Force-push the PR's own branch with `--force-with-lease` after a rebase. Never any other branch.
- Use the test methods that proof needs without asking first. This replaces a project rule that says to ask before running the app, a browser, a simulator, computer use, or screenshots. Rules that name the correct command, fixture, or check still apply. It does not cover production, data deletion, or a host approval prompt.

**Steps.**

1. **Finish the change.** Make the smallest change that meets the request. Fix the case that happened, not every case that could. If you are on the default branch, create a branch first.
2. **Prove it.** Get proof for every change in the diff. See **Proof**.
3. **Get a review.** Run the **interrogate** skill when delegation is available. Otherwise review the diff yourself against the request and say in the report that the review was not independent. Fix real findings, then prove each fix.
4. **File the PR** per `playbooks/opening-a-pr.md`, including its changelog entry. Rebase onto the latest default branch first. Add one line to the description that says how you proved the change.
5. **Babysit** per `playbooks/babysit.md` in `drive` mode. Fix real findings and CI failures. Prove each fix before you push it.
6. **Merge** with the ship skill when the merge gate passes. Ship owns the version, the changelog, the merge, and cleanup. `full stop` skips this step and reports merge-ready.
7. **Report** the PR link, the merge commit (or merge-ready state), your proof, and each decision you made for the user.

Stay active from step 1 to step 7. If you end your turn while checks or bots are pending, the work stops, because nobody will prompt you again. Wait with the watcher from `playbooks/babysit.md`. On T3 that is `watch_pull_request`. Call `unwatch_pull_request` before you stop for any reason other than a merge.

**Proof.** Proof is evidence you observed in this session: command output, a reproduction, a screenshot. Use the most direct proof the change allows.

- Reproduce the original failure, apply the fix, and watch the same reproduction pass.
- Run the checks the repository's CI runs (typecheck, lint, tests).
- Add one focused test that fails without the fix, when the behavior has none and the repository has a test setup.
- For UI and runtime behavior, run the app and look at the change. Green mocked tests do not prove the user experience. Use `control-ui` or `control-cli`. Attach screenshots to the PR when they help and you can upload them.

If you cannot prove a change, you do not have full confidence. Ask.

**Merge gate.** All of these hold on the latest head:

- Your proof covers every change in the diff.
- Required checks are green.
- Review bots have finished, and each finding is fixed or dismissed with a written reason.
- No human review still requests changes.
- The branch is up to date with the default branch, and the forge reports it mergeable.

Merge with the method the repository uses, through branch protection as configured. Never use `--admin` or another bypass. If the repository uses a merge queue or auto-merge, stay until the forge reports the PR merged. An automated "needs human review" label does not block a merge when your proof is complete.

**Asking the user.** A question in a normal message goes unseen, and the thread looks finished. Ask with the host's question tool so the thread shows it is waiting. Put the PR link, the blocker, and the options with your recommendation first in the question itself. Ask only when:

- You cannot prove the change.
- The merge gate cannot pass and you cannot fix that yourself.
- The next step is outside the grant: deleting data, touching production, changing things outside the repository, closing a PR, or force-pushing another branch.
- The goal is ambiguous in a way that changes the result.
- Another PR makes this one obsolete.

Decide everything else with sensible defaults and list those decisions in the report. If no question tool exists, or it returns no answer, leave the PR open and unmerged and start the final message with the question.

**Reply:** the PR link, the merge commit or merge-ready state, the proof, the review result, and every decision made for the user.
