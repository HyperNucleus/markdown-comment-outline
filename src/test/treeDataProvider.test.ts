import * as assert from 'assert';
import * as vscode from 'vscode';
import { MarkdownCommentOutlineTreeDataProvider, SectionTreeItem } from '../treeDataProvider';
import { SectionIndex } from '../sectionIndex';

// The invariant this suite exists for: `TreeView.reveal()` matches elements by
// **object reference** against what `getChildren()` handed back. A rebuilt
// SectionTreeItem with identical field values is a stranger to the tree, and the
// failure is completely silent — the `if (item)` guard in cursorSync skips the
// reveal, the editor highlight keeps working, and only the sidebar quietly stops
// scrolling. It was documented in prose in three places and asserted nowhere.
//
// Every assertion below uses `strictEqual`, never `deepStrictEqual`. The bug
// class *is* identity: two objects with identical contents are precisely the
// failure mode, so a deep-equality assertion would pass against a broken
// refactor and hand back false confidence.
suite('Tree Data Provider Tests (reveal identity)', () => {

	let index: SectionIndex;
	let provider: MarkdownCommentOutlineTreeDataProvider;

	setup(() => {
		index = new SectionIndex();
		provider = new MarkdownCommentOutlineTreeDataProvider(index);
	});

	teardown(() => {
		index.dispose();
	});

	async function refreshedWith(content: string) {
		const document = await vscode.workspace.openTextDocument({ content, language: 'python' });
		provider.refresh(document);
		return document;
	}

	test('Should return the same instance getChildren handed out', async () => {
		await refreshedWith('# # Root\n# ## Child\n');

		const roots = provider.getChildren();
		assert.strictEqual(roots.length, 1);
		assert.strictEqual(provider.findTreeItemBySection(roots[0].section), roots[0]);
	});

	test('Should hand out stable instances across repeated getChildren calls', async () => {
		await refreshedWith('# # Root\n# ## Child\n');

		const first = provider.getChildren();
		const second = provider.getChildren();
		assert.strictEqual(second[0], first[0]);

		const firstChildren = provider.getChildren(first[0]);
		assert.strictEqual(provider.getChildren(first[0])[0], firstChildren[0]);
	});

	test('Should return cached instances up the parent chain', async () => {
		// reveal() walks parents, so every link must be a cached instance too —
		// a freshly built parent breaks the reveal just as a freshly built child does.
		await refreshedWith('# # Root\n# ## Child\n# ### Grandchild\n');

		const root = provider.getChildren()[0];
		const child = provider.getChildren(root)[0];
		const grandchild = provider.getChildren(child)[0];

		assert.strictEqual(provider.getParent(grandchild), child);
		assert.strictEqual(provider.getParent(child), root);
		assert.strictEqual(provider.getParent(root), undefined);
	});

	test('Should key the cache by uniqueId, not name', async () => {
		// Duplicate section names are legal. Two sections sharing a name must not
		// collapse onto one cached item, or reveal would jump to the wrong one.
		const document = await refreshedWith('# # Setup\n# # Setup\n');
		const sections = index.getSections(document);

		const roots = provider.getChildren();
		assert.strictEqual(roots.length, 2);
		assert.notStrictEqual(roots[0], roots[1]);
		assert.strictEqual(provider.findTreeItemBySection(sections[0]), roots[0]);
		assert.strictEqual(provider.findTreeItemBySection(sections[1]), roots[1]);
	});


  test('Should materialize a stable item before VS Code requests children', async () => {
    const document = await refreshedWith('# ### Root\n# ###### Deep');
    const sections = index.getSections(document);
    const child = provider.findTreeItemBySection(sections[1]);
    assert.ok(child);
    const roots = provider.getChildren();
    assert.strictEqual(roots[0].label, 'Root');
    assert.strictEqual(provider.getParent(child), roots[0]);
    assert.strictEqual(provider.getChildren(roots[0])[0], child);
    assert.strictEqual(provider.findTreeItemBySection(sections[1]), child);
    assert.strictEqual(provider.findTreeItemBySection({ ...sections[1], uniqueId: 'stale' }), undefined);
  });

	test('Should return no children before any refresh', async () => {
		assert.deepStrictEqual(provider.getChildren(), []);
	});
});

// `markdownCommentOutline.showIcons` (#57). Two separate things are asserted here and the
// split is deliberate: the item-level tests pin *how* an icon is suppressed
// (`iconPath` left undefined — there is no blank ThemeIcon to assign), while the
// provider-level test pins that the setting is actually plumbed through. Neither
// implies the other: the item could honour its flag perfectly while the provider
// never reads the setting.
suite('Tree Data Provider Tests (icon visibility)', () => {

	let index: SectionIndex;
	let provider: MarkdownCommentOutlineTreeDataProvider;

	setup(() => {
		index = new SectionIndex();
		provider = new MarkdownCommentOutlineTreeDataProvider(index);
	});

	teardown(async () => {
		index.dispose();
		// Global config outlives the suite — put it back or every later suite runs
		// against whatever this one left behind.
		await vscode.workspace.getConfiguration('markdownCommentOutline')
			.update('showIcons', undefined, vscode.ConfigurationTarget.Global);
	});

	async function sectionFixture() {
		const document = await vscode.workspace.openTextDocument({
			content: '# # Root\n# ## Child\n# ### Grandchild\n# #### Leaf\n',
			language: 'python'
		});
		return { document, sections: index.getSections(document), children: index.getChildrenMap(document) };
	}

	test('Should carry the depth icon when icons are on', async () => {
		const { document, sections, children } = await sectionFixture();

		const expected = ['symbol-module', 'symbol-class', 'symbol-method', 'symbol-property'];
		sections.forEach((section, i) => {
			const item = new SectionTreeItem(section, children, document, true);
			assert.ok(item.iconPath instanceof vscode.ThemeIcon, `depth ${i + 1} lost its icon`);
			assert.strictEqual((item.iconPath as vscode.ThemeIcon).id, expected[i]);
		});
	});

	test('Should leave iconPath undefined at every depth when icons are off', async () => {
		const { document, sections, children } = await sectionFixture();

		for (const section of sections) {
			const item = new SectionTreeItem(section, children, document, false);
			assert.strictEqual(item.iconPath, undefined);
			// Hiding the icon must not cost anything else on the row.
			assert.strictEqual(item.label, section.name);
			assert.ok(item.command, 'go-to-section command dropped');
		}
	});

	test('Should default to showing icons when the flag is omitted', async () => {
		const { document, sections, children } = await sectionFixture();

		const item = new SectionTreeItem(sections[0], children, document);
		assert.ok(item.iconPath instanceof vscode.ThemeIcon);
	});

	test('Should honour markdownCommentOutline.showIcons on refresh', async () => {
		// The setting is re-read by refresh() rather than cached at construction,
		// which is what lets it apply without a window reload.
		const document = await vscode.workspace.openTextDocument({
			content: '# # Root\n# ## Child\n', language: 'python'
		});

		provider.refresh(document);
		assert.ok(provider.getChildren()[0].iconPath instanceof vscode.ThemeIcon);

		await vscode.workspace.getConfiguration('markdownCommentOutline')
			.update('showIcons', false, vscode.ConfigurationTarget.Global);
		provider.refresh(document);

		const root = provider.getChildren()[0];
		assert.strictEqual(root.iconPath, undefined);
		assert.strictEqual(provider.getChildren(root)[0].iconPath, undefined);
	});

	// The live-toggle path, and the reason `refreshCurrent()` exists. The config
	// handler has no document to hand in: the Settings editor is not a TextEditor,
	// so `vscode.window.activeTextEditor` is undefined while it has focus — which
	// is exactly where a user toggles a setting from. Rebuilding has to go through
	// the document the tree already holds.
	test('Should apply a showIcons change through refreshCurrent, with no document passed', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '# # Root\n# ## Child\n', language: 'python'
		});

		provider.refresh(document);
		assert.ok(provider.getChildren()[0].iconPath instanceof vscode.ThemeIcon);

		await vscode.workspace.getConfiguration('markdownCommentOutline')
			.update('showIcons', false, vscode.ConfigurationTarget.Global);
		provider.refreshCurrent();

		const root = provider.getChildren()[0];
		assert.strictEqual(root.iconPath, undefined);
		assert.strictEqual(provider.getChildren(root)[0].iconPath, undefined);
	});

	test('Should no-op refreshCurrent before the first refresh', () => {
		provider.refreshCurrent();
		assert.deepStrictEqual(provider.getChildren(), []);
	});
});
