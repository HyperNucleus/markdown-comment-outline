# Extension architecture

extension.ts wires providers, commands, cursor sync and configuration. SectionIndex shares parses across the symbol and tree providers. Parser results are flat, document-ordered, and readonly to consumers. Root sections have no parentId, regardless of depth. Commands and settings use markdownCommentOutline.

Preserve TreeItem identity for reveal(), and use uniqueId rather than names. cursorSync reads the tree's snapshot. Diagnostics go through log.ts. Syntax lives only in utils/findSections.ts.
