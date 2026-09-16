---
name: release
version: 0.3.0
description: Prepare a Markdown Comment Outline release in HyperNucleus/markdown-comment-outline. Build and verify the VSIX, then follow PUBLISHING.md for an explicitly requested Marketplace release.
---

# Release protocol — Markdown Comment Outline

Read the repository-root PUBLISHING.md before release work. It is the source of truth for this fork. The source repository is `HyperNucleus/markdown-comment-outline`; the extension name is `markdown-comment-outline`. Read the publisher and version from package.json rather than assuming the candidate publisher is registered.

## Repository boundary

- Inspect `git remote -v`, the worktree and current commit before writing.
- Push only to the owner's fork: `HyperNucleus/markdown-comment-outline`.
- `ran-codes/code-organizer-vscode` is a read-only upstream reference. Never push there or publish under its publisher.
- Preserve upstream MIT attribution and Git history.
- Do not create issues, comments, public releases or announcements unless the user explicitly requests them.

## Prepare and verify

1. Establish the intended release version from the user's request; ask only if it is not specified or inferable.
2. Update package.json, lockfile, CHANGELOG and affected README examples.
3. Run `npm ci`, `npm run test:unit`, `npm test` and `npm run package:vsix`. Fix failures before proceeding.
4. Inspect the VSIX allowlist and install in an isolated VS Code profile. Verify hierarchy, commands, navigation, cursor sync, highlighting and settings. Report any checks that could not be completed.
5. Commit and push to the fork when already authorized; preserve unrelated user changes.

## Publication boundary

Preparing a release is not authorization to publish it. The initial fork task only prepares Marketplace publication. Do not register publishers, publish to Marketplace/Open VSX, or save authentication tokens as part of preparation.

For a later explicit publication request, follow PUBLISHING.md using the manifest's verified publisher identity and the tested VSIX. Credentials must not appear in source, logs or chat. Ask the user to complete interactive authentication themselves if no authorized authentication route is available. Verify the resulting extension ID and version before reporting publication complete.
