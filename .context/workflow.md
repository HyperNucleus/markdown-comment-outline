# Fork workflow

The current release procedure for **Markdown Comment Outline** is [PUBLISHING.md](../PUBLISHING.md). The live release skill is [.claude/skills/release/SKILL.md](../.claude/skills/release/SKILL.md).

Only `HyperNucleus/markdown-comment-outline` is a write destination. The `upstream` remote, `ran-codes/code-organizer-vscode`, is read-only. The candidate Marketplace publisher is `HyperNucleus`; verify its ownership and availability before any future publication.

Development gates: `npm ci`, `npm run test:unit`, `npm test`, `npm run package:vsix`, isolated VSIX installation, and review of CI. Preserve MIT attribution. Do not publish or create release announcements during release preparation.

Historical upstream workflow details remain available in Git history. Other .context research documents describe upstream history and do not override the fork's current identity or publishing instructions.
