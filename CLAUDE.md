# Markdown Comment Outline development

Read README.md for the grammar and PUBLISHING.md for release preparation. The fork preserves upstream history and MIT copyright. Historical .context/ and .claude/ release notes describe upstream, not this fork's publishing policy.

All shipped code is in src/ and bundled from src/extension.ts. Both providers read through SectionIndex; findSections is the single parser. Keep parsing pure and preserve immutable shared snapshots, document/version/language/config cache validity, unique IDs, and cached TreeItem identity.

Run npm run test:unit, npm test, and npm run package:vsix. CI uses Node 24. Publishing is separate from implementation and requires the owner's explicit release instruction.
