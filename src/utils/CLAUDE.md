# Pure helpers

findSections(text, languageId?, maxNestingLevel = 6) recognizes the seven comment-heading families documented in README. Hash count is depth; do not clamp deeper headings into shallower ones. Resolve parents after document-order sorting. Keep SectionMatch fields stable. Native Markdown/Quarto fence and front-matter exclusions retain upstream behavior.

Only vscodeHelpers.ts imports vscode. getCurrentSection takes offsets and includes EOF in the last section. sectionTree indexes children by parentId; providers choose parentless roots.
