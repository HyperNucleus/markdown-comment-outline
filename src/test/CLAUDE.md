# Tests

comment-headings.test.ts replaces upstream legacy-syntax tests. mixed-syntax.test.ts preserves ordering regressions with migrated fixtures. Native Markdown/Quarto and non-parser regression suites remain. Cache and TreeItem tests must use strict reference equality where identity is the invariant.

npm run test:unit runs vscode-free suites. npm test compiles and runs all suites inside the Extension Development Host.
