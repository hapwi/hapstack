<!-- agent-changelog-start -->

## Changelog

Maintain CHANGELOG.md as public-facing product documentation, including in private
projects and developer tools. Create it if missing.

Describe user-visible product behavior under [Unreleased], using Added, Changed,
Deprecated, Removed, Fixed, or Security as appropriate. Group related changes into
one concise entry. Include documentation changes when they change guidance users
rely on. Omit changes with no user-visible effect.

Exclude agent work narration, tests run or their results, local-machine setup,
commands and checklists performed, internal execution, and packaging or proof
procedures. Exclude hostnames, local paths, and private identifiers. Describe
genuine setup or testing-tool features by their changed behavior for users.
Do not list setup or tests performed merely to get one operator's machine working.

Mark breaking changes explicitly and include migration guidance when needed.
Preserve required versions, release dates, meaningful compatibility requirements,
existing release history, and unrelated entries. Include user-facing commands
when needed to explain changed behavior or migration. Record completed changes,
not planned work.

## Release management

Follow the repository’s release process and the operator’s explicit versioning policy. Without a selected bump-on-ship policy, prepare a release only when the user requests one. Ordinary development updates
CHANGELOG.md under [Unreleased] without changing the project version or moving
entries into a release section.

For an authorized release, follow an explicit target version. Otherwise select
the recommended version from the repository policy and included changes without
a routine version question, and report the rationale. Use patch for fixes,
maintenance, or documentation, minor for compatible features, and major for
breaking changes, subject to the project's pre-1.0 conventions. Preserve the
established prerelease channel and sequence; shipping alone does not authorize
stable promotion. Ask only for unresolved compatibility or conflicting
release-policy decisions. Preserve repository approval gates and use YYYY-MM-DD
dates. Creating or pushing tags, publishing a release, and deploying require
authorization for those actions.

<!-- agent-changelog-end -->
