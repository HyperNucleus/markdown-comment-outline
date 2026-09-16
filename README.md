# Markdown Comment Outline

Navigate code with Markdown headings inside comments. This fork of [Code Organizer](https://github.com/ran-codes/code-organizer-vscode) keeps its Outline, breadcrumbs, Go to Symbol, dedicated tree view, cursor synchronization and section highlighting.

```ts
// # Application
const name = 'demo';

// ## Configuration
const enabled = true;

// ### Validation
function validate() { return enabled; }
```

Open **Markdown Comment Outline: Show Markdown Comment Outline** from the Command Palette, or use the extension's Activity Bar view. Click a section to navigate to its line. The built-in Outline, breadcrumbs and Go to Symbol also receive the section symbols; when multiple symbol providers exist, VS Code controls which provider its built-in UI displays.

## Syntax

| Comment family | Level-two example |
| --- | --- |
| JavaScript, TypeScript, C/C++, Java, Go, Rust, etc. | `// ## Title` |
| Python, R, Shell, etc. | `# ## Title` |
| SQL | `-- ## Title` |
| Mermaid | `%% ## Title` |
| CSS and single-line block comments | `/* ## Title */` |
| HTML | `<!-- ## Title -->` |
| JSX/TSX | `{/* ## Title */}` |

Use one to six hashes for heading depth. Indentation is allowed; separate the comment opener, hashes and nonempty title with spaces or tabs. Block comments must close on the same line. Titles are plain text: Markdown emphasis, closing hashes and trailing dashes are not interpreted or removed.

Skipped levels are allowed. A heading belongs to the nearest preceding shallower heading. A heading with no parent appears at the root, even if the file starts with `##` or `###`.

Only standalone comment lines are recognized. Old formats such as `//// Title ----`, code followed by a trailing comment, seven-hash headings and multiline block-comment interiors are not supported. This is a lightweight line-based recognizer, not a language lexer: comment-looking lines inside multiline strings can still be recognized. Comment families are accepted across enabled languages, as in upstream.

Markdown/Quarto use native headings (`## Title`) and retain upstream YAML-front-matter and backtick-fence handling. Upstream behavior for unterminated fences/front matter is preserved: an unclosed block excludes nothing.

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| `markdownCommentOutline.enable` | `true` | Enable the extension; reload after changes. |
| `markdownCommentOutline.supportedLanguages` | `["*"]` | Language IDs to support; reload after changes. |
| `markdownCommentOutline.maxNestingLevel` | `6` | Show depths 1 through this value (1–6); reload after changes. |
| `markdownCommentOutline.showIcons` | `true` | Show depth icons in the dedicated tree; updates immediately. |

The current section uses the theme color `markdownCommentOutline.currentSectionBackground`. Built-in Outline and breadcrumb icons follow VS Code's own `outline.icons` and `breadcrumbs.icons` settings.

## Migration from Code Organizer

This is a separate extension (`HyperNucleus.markdown-comment-outline`) with separate commands, views and settings. Old syntax is intentionally not recognized, and `minDashes` no longer exists. Convert `//// Title ----` to `// ## Title`, `## Title ----` in Python to `# ## Title`, and `{/* //// Title ---- */}` to `{/* ## Title */}`. Existing source files are never rewritten automatically.

## Install and develop

Download/build the VSIX and use **Extensions: Install from VSIX…**. Marketplace publication is being prepared; no published listing is claimed.

```sh
npm ci
npm run test:unit
npm test
npm run package:vsix
code --install-extension ./markdown-comment-outline-0.1.0.vsix
```

Use Node.js 24 (see `.nvmrc`) or a newer supported version satisfying the dependencies. See `package.json` for the minimum VS Code version. `npm test` launches an isolated Extension Development Host. Press F5 for interactive development. CI runs tests and uploads a VSIX artifact; it does not publish.

See [PUBLISHING.md](PUBLISHING.md) for publisher setup and release instructions.

## Attribution

Based on [ran-codes/code-organizer-vscode](https://github.com/ran-codes/code-organizer-vscode), upstream commit `dd983cafb09b325694690b8f3eba63afa0b5f820`. Original copyright and MIT license are retained in [LICENSE](LICENSE). Upstream historical notes and release history remain in the repository; this README and PUBLISHING.md describe the fork.
