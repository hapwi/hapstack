# Writing changelog entries

The changelog is a full record of meaningful changes, written for people who use the product. They did not build it, did not see the code, and may not be technical. Record everything worth knowing about, then write it so that person understands what changed and why it matters, from that one line alone.

## What to include

Include every meaningful change, not only the ones users see on screen:

- New features, changed behavior, and fixed problems.
- Behind-the-scenes work that makes the product safer, faster, more reliable, or easier to keep running, such as security hardening, updated underlying tools, better error recovery, or cleanup that removes old parts.
- Removed or retired features, and anything users must act on.
- Documentation and help changes people rely on.

Leave out only noise: the record of how the work was done (tests run, reviews, AI or agent involvement, ticket or PR numbers, commit hashes, names), pure formatting or code-comment edits, typo fixes in code, and changes that were added and undone before a release.

## The test for every entry

Read the entry as someone who has only ever used the product. Ask:

1. **Do they know what it is about?** The entry names the feature, screen, task, or part of the product in words they would recognize.
2. **Do they know what is different now?** The entry says what they can do, what works better, what problem is gone, or what improved behind the scenes.
3. **Do they know why it matters?** For behind-the-scenes work, the entry says what it means for them: safer, faster, more reliable, longer supported.
4. **Would they need to ask someone what a word means?** If yes, replace the word.

An entry that fails any of these gets rewritten, not dropped.

## Rules

- **Lead with the result.** Start with what they can do or what improved: "You can now…", "Search now finds…", "Fixed a problem where…".
- **Use the product's own words.** Name buttons, menus, pages, and settings the way the user sees them. Internal names such as components, functions, files, database tables, endpoints, flags, and libraries mean nothing to most readers, so use one only when readers type or see it (see **Developer tools**).
- **Describe fixes by the problem people saw, not the cause.** "Fixed a problem where photos sometimes uploaded sideways" beats "Fixed EXIF orientation handling".
- **Be specific.** "Various bug fixes", "Performance improvements", and "Minor updates" tell the reader nothing. Say what got faster or what stopped breaking. Use a number only when it was measured.
- **One change per entry, usually one or two short sentences.** Combine several small related changes into one entry instead of listing each.
- **Plain words.** Avoid jargon such as API, cache, refactor, migration, endpoint, dependency, config, race condition, regression, and backend. When a technical word is unavoidable, add a few plain words that explain it.
- **No work narration.** Leave out how the change was made, tests, reviews, AI or agent involvement, PR or ticket numbers, commit hashes, people's names, file paths, hostnames, and private details.
- **Calm, friendly tone.** No hype ("revolutionary", "blazing fast", exclamation marks) and no blame.
- **Complete changes only.** Planned or unfinished work belongs in a roadmap, not the changelog.

## Behind-the-scenes changes

Work users do not see directly goes under the normal headings, usually **Improved**, **Fixed**, **Removed**, or **Security**. Describe what the work does for them, not how it was done. Name the area in everyday words ("sign-in", "file uploads", "the parts the app is built on") and say the benefit.

Examples:

- "Updated the tools the app is built on to their latest versions, so it stays secure and supported."
- "Uploads now recover on their own after a brief connection drop."
- "Removed old, unused parts of the app, which makes future updates faster and safer."

## When a user has to do something

Put it under **Action needed** at the top of the release. Say:

1. What changed or stopped working.
2. Who is affected.
3. Exactly what to do, step by step, in plain words.

Example: "Saved filters from before this update no longer load. If you used saved filters, open **Filters**, choose **Import old filters**, and save them again."

## Security fixes

Say what is now protected without describing how to attack it. Tell users whether they need to do anything, such as sign in again or update.

Example: "Improved protection for shared links so they can no longer be opened after you turn sharing off."

## Developer tools

When the product is itself a tool for developers, its users are developers. A command or setting they type is part of the product and can appear in an entry. The other rules still apply: describe the change from the user's side, name the command they run rather than the code behind it, and keep the sentence plain.

Example: "`deploy` now asks before replacing an existing site, so you can't overwrite one by accident."

## Examples

| Instead of | Write |
| --- | --- |
| Refactored auth middleware to use JWT refresh tokens. | You stay signed in for 30 days instead of having to sign in again every day. |
| Fixed race condition in upload queue. | Fixed a problem where uploading many files at once sometimes skipped a few. |
| Added CSV export endpoint. | You can now download your reports as a spreadsheet from the **Export** menu. |
| Performance improvements. | Large projects now open about twice as fast. |
| Bumped React to 19 and fixed lint warnings. | Updated the tools the app is built on to their latest versions, so it stays secure and supported. |
| Updated copy on onboarding modal. | The welcome screen now explains each step more clearly. |
| Deprecated v1 webhooks. | Old-style notifications will stop working on June 1. See **Action needed** for how to switch. |
| Added retry with exponential backoff to the sync worker. | Syncing now keeps trying on its own when the connection is shaky, instead of giving up. |
| Ran tests and verified the fix. | (Leave out. This is how the work was done, not a change.) |

## Format for a new changelog

Use this layout when a project has no changelog yet. When one exists, keep its layout, headings, and date format, and write new entries in its style while applying the rules above.

```markdown
# Changelog

What's new and changed in <Product>, newest first.

## Unreleased

### New
- You can now …

### Improved
- …

### Fixed
- Fixed a problem where …

## 1.2.0 - 2026-03-04

A short sentence on the highlights, when the release has several changes.

### Action needed
- …

### New
- …
```

Section headings, in this order, used only when they have entries: **Action needed**, **New**, **Improved**, **Fixed**, **Removed**, **Security**. Dates use `YYYY-MM-DD` so readers everywhere read them the same way.
