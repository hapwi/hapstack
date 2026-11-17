<!-- agent-changelog-start: Hapstack changelog policy v4 -->

## Changelog

> Hapstack changelog policy, version 4. Hapstack updates this section automatically while its text is unchanged. To customize it, edit it here; Hapstack then leaves it alone and offers updates for you to review.

CHANGELOG.md is the public record of meaningful changes to this project. People
who use the product read it, and many of them are not technical. Create the file
if it is missing.

Adding and editing entries under Unreleased is routine work and needs no
approval. Add the entry in the same change as the work it describes.

### What to record

Record every meaningful change: new features, changed behavior, fixed problems,
removed features, and behind-the-scenes work such as security hardening,
updated underlying tools, and reliability or speed improvements. Leave out
changes that mean nothing to a reader, such as formatting, code comments, typo
fixes in code, and work that was undone before a release.

Group entries under Action needed, New, Improved, Fixed, Removed, and Security,
in that order, using only the headings that have entries. If the file already
uses other headings, keep its style.

### How to write an entry

Write each entry so a reader understands it from that line alone, without
seeing the code:

- Start with the result: "You can now…", "Search now finds…", "Fixed a problem
  where…".
- Use the names people see in the product. Internal names such as functions,
  files, and libraries mean nothing to most readers; use them only when readers
  type or see them, such as a command in a developer tool.
- Describe a fix by the problem people saw, not its technical cause.
- For behind-the-scenes work, say what it means for the reader: safer, faster,
  more reliable, or supported longer.
- Be specific. "Various bug fixes" tells the reader nothing; say what was fixed.
- Use plain words, and explain a technical term in a few words when you need one.
- Keep entries short, usually one or two sentences, and combine small related
  changes into one entry.
- Leave out how the work was done: tests, reviews, AI or agent involvement,
  ticket or PR numbers, commit hashes, people's names, file paths, and hostnames.
  Readers care what changed, and these details can expose private information.

When readers must do something, add an Action needed entry that says what
changed, who is affected, and the exact steps to take. For a security fix, say
what is now protected without describing how to attack it.

Record completed work only. Keep released sections, their dates, and other
people's entries as they are unless asked to change them.

### Releases

Ordinary work adds entries under Unreleased and leaves the version alone. Prepare
a release when the user asks for one or when the project's versioning policy
calls for it. Use the version the user gives. Otherwise choose patch for fixes,
minor for new features, and major for changes that need reader action, following
the project's pre-1.0 and prerelease conventions, and say why you chose it.

At release, move the shipped entries into a new section headed with the version
and a YYYY-MM-DD date, and leave an empty Unreleased section above it. Ask before
creating tags, publishing releases, or deploying, because those reach people
outside the repository.

<!-- agent-changelog-end -->
