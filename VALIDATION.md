# Validation — 2026-09-16

## Source and identity

- Fork base: `ran-codes/code-organizer-vscode@dd983cafb09b325694690b8f3eba63afa0b5f820`.
- GitHub confirmed `HyperNucleus/markdown-comment-outline` is a fork of that repository.
- Extension: `HyperNucleus.markdown-comment-outline`, version `0.1.0`.
- Minimum VS Code: `1.137.0` (latest stable published API types queried during implementation).
- Tested on macOS arm64, Node `25.8.1`, npm `11.11.0`, VS Code stable `1.138.0`.
- CI and `.nvmrc` select supported Node 24.

## Completed checks

- Clean `npm ci` succeeds from the committed lockfile.
- TypeScript 7.0.2 type checking and Oxlint 1.83.0 pass.
- 87 pure parser/helper tests pass.
- 117 tests pass in the real VS Code Extension Development Host, including preserved Markdown/Quarto and non-parser regressions, depth filtering, parentless roots, duplicate names, registered symbol-provider execution, command navigation, tree identity, icon settings, and immediate cursor synchronization after edits.
- Production esbuild and `npm run package:vsix` succeed.
- `code --install-extension` succeeds in isolated temporary user-data/extensions directories; `--list-extensions --show-versions` reports `hypernucleus.markdown-comment-outline@0.1.0`.
- The installed VSIX was opened in a separate VS Code window: the native breadcrumb displays `Application`, and the corresponding heading line is highlighted. Full interactive tree/settings inspection was limited by the native UI control channel; their API behavior is covered by host tests.
- VSIX contains exactly 9 files: two VSIX metadata files plus the extension manifest, README, changelog, MIT license, icon, bundle and Activity Bar icon. No source, node_modules, credentials or local configuration is packaged.
- Production dependency audit: zero vulnerabilities; the extension has no npm runtime dependencies.

## Dependency notes

All direct development dependency versions were queried from npm's stable version metadata and pinned. Compatible indirect dependencies were refreshed with `npm update`, and a clean install verified the lockfile.

The latest typescript-eslint parser requires TypeScript `<6.1.0`, so ESLint/typescript-eslint was replaced by [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) rather than forcing an incompatible TypeScript 7 dependency tree. Type checking remains a separate required build step.

The latest `@vscode/test-cli@0.0.15` still pulls an older Mocha dependency tree. Full development audit reports four advisories (two low, one moderate, one high) in that test-only subtree. npm suggests a test-cli downgrade; no incompatible override or forced downgrade was applied. These dependencies are excluded from the VSIX.

CI uses verified stable action releases: checkout 7.0.1, setup-node 7.0.0, upload-artifact 7.0.1. Remote CI status is independent of the local results above.

## Release state

VSIX built locally. Marketplace publisher registration/availability is not yet verified. No Marketplace or Open VSX publication has been performed. Follow PUBLISHING.md for the remaining publisher setup and manual release steps.
