import * as assert from 'assert';
import * as vscode from 'vscode';
import { findSections } from '../utils/findSections';

suite('Extension integration', () => {
  test('independent commands, symbol provider, and navigation work in the host', async () => {
    const extension = vscode.extensions.getExtension('HyperNucleus.markdown-comment-outline');
    assert.ok(extension);
    await extension.activate();
    const commands = await vscode.commands.getCommands(true);
    for (const command of ['activate', 'showView', 'goToSection']) {
      assert.ok(commands.includes(`markdownCommentOutline.${command}`));
    }
    const doc = await vscode.workspace.openTextDocument({
      language: 'plaintext', content: '// ### Orphan\nbody\n// ###### Detail\nbody'
    });
    const editor = await vscode.window.showTextDocument(doc);
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      'vscode.executeDocumentSymbolProvider', doc.uri
    );
    assert.ok(symbols);
    assert.strictEqual(symbols[0].name, 'Orphan');
    assert.strictEqual(symbols[0].children[0].name, 'Detail');
    const detail = findSections(doc.getText())[1];
    await vscode.commands.executeCommand('markdownCommentOutline.goToSection', detail, doc);
    assert.strictEqual(editor.selection.active.line, 2);
    assert.ok(editor.selection.isEmpty);
    await vscode.commands.executeCommand('markdownCommentOutline.showView');
  });
});
