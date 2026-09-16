// # 1. Type Definitions
export interface SectionMatch {
  name: string;
  index: number;
  fullText: string;
  depth: number;
  /** The parent section's `uniqueId`, or undefined when no shallower section precedes it. */
  parentId?: string;
  uniqueId: string; // New property: name + index for unique identification
}

/** Each pattern captures the heading hashes and the plain-text title. */
const headingSource = (open: string, close = ''): string =>
  String.raw`^[ \t]*${open}[ \t]+(#{1,6})[ \t]+([^\r\n]+?)${close}[ \t]*$`;

const COMMENT_PATTERNS = [
  headingSource('#'),
  headingSource(String.raw`\/\/`),
  headingSource('--'),
  headingSource('%%'),
  headingSource(String.raw`\/\*`, String.raw`[ \t]*\*\/`),
  headingSource('<!--', String.raw`[ \t]*-->`),
  headingSource(String.raw`\{\/\*`, String.raw`[ \t]*\*\/[ \t]*\}`),
];

// Keep native Markdown/Quarto recognition separate from comment headings.
const MARKDOWN_PATTERNS = [String.raw`^(#{1,6})\s+(.+?)\s*$`];

// # 3. Main Section Parser
/**
 * Find all section matches in text.
 * `COMMENT_PATTERNS` is the list of supported comment syntaxes — read it there
 * rather than duplicating it here, where it only drifts as the table grows.
 * Special handling for Markdown/Quarto: headers without ----
 */
export function findSections(text: string, languageId?: string, maxNestingLevel = 6): SectionMatch[] {
  // console.log(`[Markdown Comment Outline > findSections] Processing file type: ${languageId}`);
  const matches: SectionMatch[] = [];

  // Check if this is a Markdown or Quarto file
  const isMarkdownOrQuarto = languageId && ['markdown', 'quarto', 'md', 'qmd', 'rmd'].includes(languageId.toLowerCase());

  // For Markdown/Quarto files, collect the line ranges to exclude from parsing:
  // YAML front matter and ``` code blocks both land in this one list.
  const excludedRanges: { start: number; end: number }[] = [];
  if (isMarkdownOrQuarto) {
    const lines = text.split('\n');

    // YAML front matter: `---` as the very first line, closed by the next
    // `---` or `...` line (Pandoc accepts both). trimEnd(), not trim() — an
    // *indented* `---` is not a delimiter in YAML/Jekyll/Quarto. trimEnd() is
    // also what strips the `\r` of a CRLF document, so every delimiter check
    // here has to keep going through it; an exact `=== '---'` compare would
    // break every CRLF file on Windows.
    //
    // The search stops at the first *unindented* ``` and reports no closer. A
    // fence cannot open at column 0 inside real YAML front matter, so a `---`
    // past that point belongs to a code block, not to metadata. Without the
    // stop, a line-1 horizontal rule plus any `---` inside a fence would
    // swallow every header in between.
    //
    // Unclosed => treated as NOT front matter, so nothing is excluded: a lone
    // top rule must not swallow every header in the file. The fence scan below
    // follows the same rule for the same reason — see the unmatched-fence note.
    //
    // Known limitation (#44): a line-1 `---` with a coincidental later `---` or
    // `...` is taken as front matter even when both were meant as horizontal
    // rules. Accepted on purpose — Pandoc/Quarto read the same file the same
    // way, so the outline agrees with what the document renders as.
    let frontMatterEnd = -1;
    if (lines[0].trimEnd() === '---') {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trimEnd();
        if (line.startsWith('```')) {
          break;
        }
        if (line === '---' || line === '...') {
          frontMatterEnd = i;
          excludedRanges.push({ start: 0, end: i });
          break;
        }
      }
    }

    let inCodeBlock = false;
    let codeBlockStart = 0;

    // The scan starts past the front matter, which is metadata, not document
    // body. A ``` inside a block scalar (`desc: >`) must not open a phantom
    // fence: that would pair with the next real fence in the body and exclude
    // every header in between — and leave every later fence an opener/closer
    // out of phase. `frontMatterEnd === -1` (no front matter, or an unclosed
    // one) starts the scan at line 0, so there is no special case.
    for (let index = frontMatterEnd + 1; index < lines.length; index++) {
      const line = lines[index];

      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockStart = index;
        } else {
          inCodeBlock = false;
          excludedRanges.push({
            start: codeBlockStart,
            end: index
          });
        }
      }
    }
    // An unmatched opening fence excludes NOTHING, the same call made for an
    // unclosed `---` above. Extending it to EOF makes every header below the
    // fence vanish, and the most common way to get an unmatched fence is a user
    // part-way through typing one — the outline would blank out mid-edit and
    // come back only on the closing ```. It is also what turns any single
    // miscounted fence into a document-wide blackout: a stray ``` (an indented
    // one, or a `---` misread as a front matter closer leaving the scan a half
    // fence out of phase) silently empties the rest of the outline.
    //
    // The trade-off, stated plainly: headers below a genuinely unclosed fence
    // are reported as sections even though Pandoc would render them as code.
    // Showing a few sections that turn out to be code is strictly better than
    // showing none at all.
  }

  // Only standalone, single-line block comments are headings. Ignore interiors
  // of multiline comment blocks opened at the start of a line (lightweight scan,
  // not a language lexer; comment-looking text inside multiline strings remains
  // subject to the same line-based recognition as upstream).
  const blockRanges: { start: number; end: number }[] = [];
  if (!isMarkdownOrQuarto) {
    let closer: string | undefined;
    let start = 0;
    let offset = 0;
    for (const line of text.split('\n')) {
      if (closer) {
        if (line.includes(closer)) {
          blockRanges.push({ start, end: offset + line.length });
          closer = undefined;
        }
      } else {
        const opening = /^[ \t]*(\{?\/\*|<!--)/.exec(line);
        if (opening) {
          const endToken = opening[1] === '<!--' ? '-->' : '*/';
          if (!line.slice(opening[0].length).includes(endToken)) {
            closer = endToken;
            start = offset;
          }
        }
      }
      offset += line.length + 1;
    }
    if (closer) {
      blockRanges.push({ start, end: text.length });
    }
  }

  // Helper function to check if a match index is inside an excluded range
  const isExcluded = (matchIndex: number): boolean => {
    if (!isMarkdownOrQuarto) {
      return blockRanges.some(range => matchIndex >= range.start && matchIndex <= range.end);
    }

    const lines = text.substring(0, matchIndex).split('\n');
    const matchLineNumber = lines.length - 1;

    return excludedRanges.some(range =>
      matchLineNumber >= range.start && matchLineNumber <= range.end
    );
  };

  // ## 3.1 Pattern Construction
  // Compile the specs fresh on every call. The RegExp objects are deliberately
  // NOT hoisted to module level: /gm regexes carry `lastIndex` between uses, and
  // per-call construction keeps that state from leaking across documents.
  const patterns = (isMarkdownOrQuarto ? MARKDOWN_PATTERNS : COMMENT_PATTERNS)
    .map(source => new RegExp(source, 'gm'));

  // ## 3.2 Pattern Matching Loop
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const depthSymbols = match[1];
      const sectionName = match[2].trim();
      const depth = depthSymbols.length;

      // ### 3.2.1 Section Validation
      // Skip if section name is empty or just dashes/whitespace
      // Also skip if this match is inside an excluded range — a code block or
      // YAML front matter (for Markdown/Quarto)
      if (sectionName && depth <= maxNestingLevel &&
          (!isMarkdownOrQuarto || !sectionName.match(/^[-\s]*$/)) && !isExcluded(match.index)) {

        // ### 3.2.2 Match Storage
        // Create unique ID by combining name and index
        const uniqueId = `${sectionName}_${match.index}`;

        // `parentId` is deliberately left undefined here and resolved in 3.4,
        // after the sort. Resolving it inline would read a pattern-ordered array.
        matches.push({
          name: sectionName,
          index: match.index,
          fullText: match[0],
          depth: depth,
          parentId: undefined,
          uniqueId: uniqueId
        });
      }
    }
    // No lastIndex reset needed: each regex is built above for this call only,
    // and exec() already resets lastIndex to 0 when it returns null.
  }

  // ## 3.3 Result Sorting
  // Sort matches by index to maintain document order
  matches.sort((a, b) => a.index - b.index);

  // ## 3.4 Parent Resolution
  // Nearest strictly smaller depth, scanning backwards. This runs here and NOT
  // inside the match loop: 3.2 walks one pattern at a time over the whole text,
  // so `matches` is pattern-ordered until 3.3 sorts it. A backwards scan before
  // that finds the last-*pushed* shallower section, not the nearest *preceding*
  // one — and in a file mixing two comment styles those differ. The JSX pattern
  // runs after `//`, so `{/* ## Sub */}` between `// A ----` and
  // `// B ----` resolved to B, a section starting further down the document
  // (#54). Keep resolution downstream of the sort.
  for (let i = 0; i < matches.length; i++) {
    for (let j = i - 1; j >= 0; j--) {
      if (matches[j].depth < matches[i].depth) {
        matches[i].parentId = matches[j].uniqueId;
        break;
      }
    }
  }

  return matches;
}
