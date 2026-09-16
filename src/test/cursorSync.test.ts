import * as assert from 'assert';
import * as vscode from 'vscode';
import { registerCursorSync } from '../cursorSync';
import { SectionIndex } from '../sectionIndex';
import { MarkdownCommentOutlineTreeDataProvider, SectionTreeItem } from '../treeDataProvider';

suite('Cursor synchronization', () => {
  test('refresh reveals the deepest node immediately and updates after edits', async () => {
    const subscriptions: vscode.Disposable[] = [];
    const index = new SectionIndex();
    const provider = new MarkdownCommentOutlineTreeDataProvider(index);
    const decoration = vscode.window.createTextEditorDecorationType({ isWholeLine: true });
    let revealed: SectionTreeItem | undefined;
    const tree = {
      reveal: async (item: SectionTreeItem) => { revealed = item; }
    } as unknown as vscode.TreeView<SectionTreeItem>;
    const context = { subscriptions } as unknown as vscode.ExtensionContext;
    try {
      const doc = await vscode.workspace.openTextDocument({
        language: 'plaintext', content: '// ### Root\n// ###### Deep\nbody'
      });
      const editor = await vscode.window.showTextDocument(doc);
      editor.selection = new vscode.Selection(2, 4, 2, 4);
      const sync = registerCursorSync(context, tree, provider, decoration);
      await sync();
      assert.strictEqual(revealed?.section.name, 'Deep');
      assert.strictEqual(provider.findTreeItemBySection(revealed!.section), revealed);
      const edit = new vscode.WorkspaceEdit();
      edit.insert(doc.uri, new vscode.Position(2, 0), '// ##### Added\n');
      assert.ok(await vscode.workspace.applyEdit(edit));
      editor.selection = new vscode.Selection(3, 4, 3, 4);
      await sync();
      assert.strictEqual(revealed?.section.name, 'Added');
    } finally {
      for (const disposable of subscriptions) { disposable.dispose(); }
      decoration.dispose();
      index.dispose();
    }
  });
});
