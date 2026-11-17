### Opening a PR

Use at the delivery step of an authorized implementation workflow. Read-only investigations and local patcher runs do not automatically open a PR. Title and description rules are adapted from tstack's `file-pr` (see CREDITS).

**Worktree.** Inspect the current branch, status, and worktree inventory. Preserve staged, unstaged, untracked, and concurrent work. Use an isolated worktree when authorized writers would otherwise conflict. Never reset, discard, stash, or recreate the user's branch to make the workflow easier.

**Before filing.** Check whether a PR for this branch already exists, and update it instead of opening a second one. Review the diff against the base branch (usually `origin/<default>`) and confirm it matches the goal and nothing else.

**Commits.** Commit liberally, then rebase into small, ordered commits before opening. Each commit is landable and tells part of the story. Amend when the fix belongs in a just-made commit. Commit bodies do not restate the subject.

**Changelog.** If the project keeps a changelog, add the Unreleased entry for this PR per the bundled [changelog skill](../../changelog/SKILL.md). Every meaningful change gets one, including behind-the-scenes work, written in plain words for people who use the product. Skip it only for noise such as formatting or code comments.

**Cleanup.** Run the bundled `/deslop` over the diff before commit and `/no-comments` before review. Write the title, description, and commit bodies with `/technical-writing` (every layer except Diátaxis), then apply `/unslop`.

**Title.** The title usually becomes the squash commit message, so follow the repository's title convention from recent merged PRs and history. Without one, use Conventional Commits `type(scope): subject` with no trailing period. The subject says why the change matters, not how it works.

> ❌ `perf(server): negotiate permessage-deflate on the websocket`
>
> ✅ `perf(server): cut websocket frame size by 70%+ with gzipping`

**Description.** A one-minute briefing for a reviewer who has the diff. Open with the problem in plain words, from the user's original request, then the fix. Never lead with an inventory of changes.

> ❌ Removed implicit workspace carry-over from every "new thread" entry point (cmd+n, sidebar buttons, command palette). Deleted buildContextualThreadOptions and the seed-context machinery.
>
> ✅ My "new worktree" default was ignored when starting new threads on existing worktrees. Now your preferences always apply.

Keep the body under about 40 lines. After the opening, add only the sections that have something to say, as `##` headings in this order:

- `## Scope`: what it covers and what it deliberately leaves out.
- `## Tradeoffs`: rejected alternatives a reviewer would otherwise ask about.
- `## Blast radius`: who or what it touches and why that is safe or risky.
- `## Verification`: 1 to 3 bullets, each a real run and its outcome. For perf, one primary number with its unit, `before → after`.

Attach screenshots or video when they prove a claim. Full SHAs, review transcripts, and file-by-file checklists go in a linked artifact, not the body. Follow the host's attribution rule for the closing line.

**Privacy.** Before submission, check the title, description, quotes, and attachments for secrets, private paths, and personal details.

**Forge.** Select the actual remote's host and supported PR interface as documented by ship. On T3, register every created PR and stack layer with `link_pull_request` right away. If `gh pr create` fails because the GraphQL rate limit is used up, create it through REST: `gh api repos/<owner>/<repo>/pulls -f title=... -f head=... -f base=... -F body=@<file>`.

**Readiness.** Open every PR ready, never as a draft, so review bots run. With `gh`, omit `--draft`. If a PR still opens as a draft, mark it ready. Read the PR back before you report its status.

**Size and stacks.** Prefer several narrow PRs to one large one. A stack is a base-branch chain: the root PR targets the default branch, and each child rebases onto its parent's exact tip and targets the parent branch (`gh pr create --base <parent-branch>`). Branch from the default branch only for independent work.

**Babysit.** Opening a PR does not start a babysit. Post the URL and keep building. Run `playbooks/babysit.md` only when the user asks after the work exists, or as step 5 of a **Full send** run. A subagent that opens a PR posts the URL and returns to the parent without babysitting.

**Comments.** Do not post a follow-up PR comment unless it serves the request. A comment posted on the user's behalf states what it is, stays short, and never pretends to be the user.
