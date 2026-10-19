#!/usr/bin/env bash
# Read-only worktree prune audit. Classifies every git worktree by size, merge
# state, uncommitted work, remote/PR state, and the most recent chat that
# operated in it. Emits a table sorted by size with a suggested bucket. Never
# deletes anything; ownership, delivery, usage, and removal gates live in the
# worktree-cleanup playbook. No bucket is deletion authority.
#
# Usage: worktree-audit.sh [-b|--base <ref>] [repo-path]
# Optional HAPSTACK_TRANSCRIPTS_DIR points at this workspace’s transcript directory.
#   repo-path defaults to the current repo.
#   -b sets the ref the MERGED column checks against (e.g. origin/integration).
#   Without it the base is origin/HEAD, then origin/main, then origin/master.
#   origin/HEAD is the remote's default branch, not necessarily the branch PRs
#   merge into; pass -b when they differ.
set -u

base=""
while [ $# -gt 0 ]; do
	case "$1" in
	-b|--base) [ $# -ge 2 ] || { echo "error: $1 needs a ref" >&2; exit 2; }; base="$2"; shift 2 ;;
	-h|--help) sed -n '2,/^set -u/p' "$0" | sed '$d; s/^# \{0,1\}//'; exit 0 ;;
	-*) echo "error: unknown option: $1" >&2; exit 2 ;;
	*) break ;;
	esac
done

repo="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -z "$repo" ] && { echo "not in a git repo; pass a repo path" >&2; exit 1; }
cd "$repo" || exit 1
git rev-parse --git-dir >/dev/null 2>&1 || { echo "error: not a git repo: $repo" >&2; exit 1; }

# Main worktree is the first entry; everything else is a candidate.
main_wt=$(git worktree list --porcelain -z | while IFS= read -r -d '' field; do
	case "$field" in 'worktree '*) printf '%s' "${field#worktree }"; break ;; esac
done)

if [ -z "$base" ]; then
	for cand in "$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null)" origin/main origin/master; do
		[ -n "$cand" ] && git rev-parse --verify --quiet "$cand^{commit}" >/dev/null && { base="$cand"; break; }
	done
	[ -z "$base" ] && { echo "error: no base ref (origin/HEAD, origin/main, origin/master all missing); pass -b <ref>" >&2; exit 1; }
	echo "warn: no -b given; MERGED checks against $base" >&2
fi

# The base drives the merge check. The fetch is best-effort (stale is fine for
# a first pass) and runs before the check, since -b may name a branch not
# fetched yet. The explicit refspec creates it even in a single-branch clone.
case "$base" in
origin/*) git fetch origin "+refs/heads/${base#origin/}:refs/remotes/$base" --quiet 2>/dev/null \
	|| echo "warn: could not fetch $base; merged column may be stale" >&2 ;;
esac
git rev-parse --verify --quiet "$base^{commit}" >/dev/null 2>&1 || { echo "error: base ref not found: $base" >&2; exit 1; }

# GitHub PR hints by branch, fetched once. Neither exact-head delivery proof
# nor a complete dependency inventory; the playbook requires both separately.
prs=$(mktemp)
trap 'rm -f "$prs"' EXIT
gh pr list --author "@me" --state all --limit 1000 \
	--json number,state,headRefName 2>/dev/null > "$prs" || echo "[]" > "$prs"

# Optional in-scope transcript directory supplied by the operator.
transcripts="${HAPSTACK_TRANSCRIPTS_DIR:-}"
now=$(date +%s)

echo "# base: $base"
printf "SIZE\tAGE\tMERGED\tDIRTY\tREMOTE\tPR\tLAST_CHAT\tSTATE\tBUCKET\tWORKTREE\n"

git worktree list --porcelain -z | while IFS= read -r -d '' field; do
	case "$field" in
	'worktree '*) wt="${field#worktree }"; state=ready ;;
	locked*) state=locked ;;
	prunable*) [ "$state" = locked ] || state=prunable ;;
	'') printf '%s\0%s\0' "$wt" "$state" ;;
	esac
done | while IFS= read -r -d '' wt && IFS= read -r -d '' state; do
	[ "$wt" = "$main_wt" ] && continue

	size=$(du -sh "$wt" 2>/dev/null | awk '{print $1}')
	head=$(git -C "$wt" rev-parse HEAD 2>/dev/null)
	head_ts=$(git -C "$wt" log -1 --format='%ct' HEAD 2>/dev/null || echo 0)
	age=$([ "$head_ts" -gt 0 ] 2>/dev/null && echo "$(( (now - head_ts) / 86400 ))d" || echo "?")

	# Squash/rebase delivery can change commit identity. This column checks
	# ancestry only; the PR hint cannot replace exact-head host evidence.
	git merge-base --is-ancestor "$head" "$base" 2>/dev/null && merged=YES || merged=no

	# Untracked and ignored files are local state too. A failed status must
	# never turn an unreadable or missing worktree into a clean candidate.
	if ! porcelain=$(git --no-optional-locks -C "$wt" status --porcelain --untracked-files=all --ignored --ignore-submodules=none 2>/dev/null); then dirty=unknown
	elif [ -z "$porcelain" ]; then dirty=clean
	elif printf '%s\n' "$porcelain" | grep -q '^!!'; then dirty=ignored
	elif printf '%s\n' "$porcelain" | grep -qv '^??'; then
		dirty="wip:$(printf '%s\n' "$porcelain" | grep -cv '^??')"
	else dirty="scratch:$(printf '%s\n' "$porcelain" | grep -c '^??')"; fi
	if [ "$state" = ready ]; then
		for marker in MERGE_HEAD rebase-merge rebase-apply CHERRY_PICK_HEAD REVERT_HEAD BISECT_START sequencer; do
			marker_path=$(git -C "$wt" rev-parse --git-path "$marker" 2>/dev/null) || continue
			if [ -e "$marker_path" ] || [ -e "$wt/$marker_path" ]; then state="operation:$marker"; break; fi
		done
	fi

	branch=$(git -C "$wt" symbolic-ref --quiet --short HEAD 2>/dev/null || echo "")
	if [ -z "$branch" ]; then remote=detached
	elif git -C "$wt" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
		[ "$(git -C "$wt" rev-parse "origin/$branch" 2>/dev/null)" = "$head" ] \
			&& remote=pushed \
			|| remote="ahead$(git -C "$wt" rev-list --count "origin/$branch..HEAD" 2>/dev/null)"
	else remote=no-remote; fi

	pr=$([ -n "$branch" ] && jq -r --arg b "$branch" \
		'.[] | select(.headRefName==$b) | "#\(.number)/\(.state)"' "$prs" 2>/dev/null | head -1)
	[ -z "$pr" ] && pr="-"

	# Most recent chat whose transcript operated in this worktree. Match path
	# followed by "/" or a quote so glint-482 does not match glint-482-r37.
	last="-"; last_ts=0
	if [ -d "$transcripts" ]; then
		while IFS= read -r -d '' transcript_file; do
			transcript_ts=$(stat -c '%Y' "$transcript_file" 2>/dev/null || stat -f '%m' "$transcript_file" 2>/dev/null || echo 0)
			if [ "$transcript_ts" -gt "$last_ts" ] 2>/dev/null; then last_ts="$transcript_ts"; fi
		done < <(rg -l --fixed-strings --null -e "${wt}/" -e "${wt}\"" "$transcripts" 2>/dev/null)
		if [ "$last_ts" -gt 0 ] 2>/dev/null; then
			last=$(date -d "@$last_ts" '+%Y-%m-%d' 2>/dev/null || date -r "$last_ts" '+%Y-%m-%d' 2>/dev/null)
		fi
	fi
	recent=$([ "$last_ts" -gt 0 ] 2>/dev/null && [ $(( (now - last_ts) / 86400 )) -le 4 ] && echo yes || echo no)

	case "$state" in locked|prunable|operation:*) bucket="hold-$state" ;; *)
	case "$dirty" in unknown) bucket=hold-unknown ;; wip:*) bucket=hold-wip ;; scratch:*|ignored) bucket=hold-local-files ;; *)
		case "$pr" in *OPEN*) bucket=hold-open-pr ;; *)
			if [ "$recent" = yes ]; then bucket=verify-recent-chat
			elif [ "$merged" = YES ]; then bucket=verify-merged
			else bucket=review; fi ;;
		esac ;;
	esac ;;
	esac

	# Quote paths for display so tabs/newlines cannot forge extra table rows.
	printf -v display_path '%q' "$wt"
	printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
		"$size" "$age" "$merged" "$dirty" "$remote" "$pr" "$last" "$state" "$bucket" "$display_path"
done | sort -t$'\t' -k1,1 -rh
