import * as assert from 'assert';
import { findSections } from '../utils/findSections';

const styles = [
  ['//', '', 'typescript'], ['#', '', 'python'], ['--', '', 'sql'],
  ['%%', '', 'mermaid'], ['/*', ' */', 'css'],
  ['<!--', ' -->', 'html'], ['{/*', ' */}', 'typescriptreact']
];

suite('Markdown headings in comments', () => {
  for (const [open, close, language] of styles) {
    const heading = (hashes: string, title: string) => `${open} ${hashes} ${title}${close}`;
    test(`${language}: six exact depths, names, parents and offsets`, () => {
      const lines = Array.from({ length: 6 }, (_, i) => heading('#'.repeat(i + 1), `层级 ${i + 1}`));
      const text = lines.join('\r\n');
      const sections = findSections(text, language);
      assert.strictEqual(sections.length, 6);
      sections.forEach((section, i) => {
        assert.strictEqual(section.depth, i + 1);
        assert.strictEqual(section.name, `层级 ${i + 1}`);
        assert.strictEqual(section.fullText, lines[i]);
        assert.strictEqual(section.index, text.indexOf(lines[i]));
        assert.strictEqual(section.parentId, i ? sections[i - 1].uniqueId : undefined);
      });
    });
    test(`${language}: whitespace, duplicate titles, skipped depths, EOF`, () => {
      const text = `\t ${open}\t###\t重复${close}\n${heading('######', '重复')}\n${heading('##', '重复')}`;
      const sections = findSections(text, language);
      assert.deepStrictEqual(sections.map(s => s.depth), [3, 6, 2]);
      assert.deepStrictEqual(sections.map(s => s.name), ['重复', '重复', '重复']);
      assert.strictEqual(new Set(sections.map(s => s.uniqueId)).size, 3);
      assert.strictEqual(sections[1].parentId, sections[0].uniqueId);
      assert.strictEqual(sections[2].parentId, undefined);
    });
    test(`${language}: rejects missing spaces, empty and seven-level headings`, () => {
      for (const text of [
        `${open}## Invalid${close}`, `${open} ##Invalid${close}`,
        heading('#######', 'Invalid'), heading('##', ''),
        `${open}\n## Invalid${close}`, `${open} ##\nInvalid${close}`,
        `value = 1; ${heading('##', 'Trailing')}`,
        `${open} Ordinary comment${close}`
      ]) {
        assert.deepStrictEqual(findSections(text, language), [], JSON.stringify(text));
      }
    });
    test(`${language}: applies nesting limit without flattening titles`, () => {
      const text = [heading('#', 'Root'), heading('###', 'Deep'), heading('##', 'Child')].join('\n');
      const sections = findSections(text, language, 2);
      assert.deepStrictEqual(sections.map(s => [s.name, s.depth]), [['Root', 1], ['Child', 2]]);
      assert.strictEqual(sections[1].parentId, sections[0].uniqueId);
    });
    test(`${language}: title is plain text, dashes have no special meaning`, () => {
      assert.strictEqual(findSections(heading('##', '**标题** ----'), language)[0].name, '**标题** ----');
    });
    if (close) {
      test(`${language}: requires a same-line closing delimiter`, () => {
        assert.deepStrictEqual(findSections(`${open} ## Unclosed`, language), []);
        assert.deepStrictEqual(findSections(`${open} ## Unclosed\n${close}`, language), []);
      });
    }
  }

  test('rejects all legacy styles and Mermaid directives', () => {
    for (const text of ['# Old ----', '## Old ----', '// Old ----', '//// Old ----',
      '-- Old ----', '---- Old ----', '{/* //// Old ---- */}', '%%%% ## Wrong',
      '%%{init: {"theme":"dark"}}%%']) {
      assert.deepStrictEqual(findSections(text), [], text);
    }
  });

  test('does not consume an adjacent line or carry regex state across calls', () => {
    const text = '//\n// # Valid\n#\n%% ## Child\n';
    for (let i = 0; i < 3; i++) {
      assert.deepStrictEqual(findSections(text).map(s => s.name), ['Valid', 'Child']);
    }
  });

  test('all comment styles share document-ordered parent resolution', () => {
    const text = styles.map(([open, close], i) => `${open} ${i % 2 ? '##' : '#'} Item ${i}${close}`).join('\n');
    const sections = findSections(text);
    assert.strictEqual(sections.length, styles.length);
    for (let i = 1; i < sections.length; i += 2) {
      assert.strictEqual(sections[i].parentId, sections[i - 1].uniqueId);
    }
  });

  test('ignores headings inside multiline block comments', () => {
    for (const [open, close] of [['/*', '*/'], ['<!--', '-->'], ['{/*', '*/}']]) {
      const text = `${open}\n// # Hidden\n# ## Hidden\n${close}\n// # Visible`;
      assert.deepStrictEqual(findSections(text).map(s => s.name), ['Visible']);
    }
  });

  test('native Markdown still uses six native heading levels', () => {
    assert.deepStrictEqual(findSections('##### Five\n###### Six', 'markdown').map(s => s.depth), [5, 6]);
  });
});
