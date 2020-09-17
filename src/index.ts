import { commands, CompleteResult, ExtensionContext, listManager, sources, workspace } from 'coc.nvim';
import * as client from "vscode-languageclient";
import * as path from "path";
// import { registerCommands } from "./commands";
// import { MessageWithOutput } from "./requestExt";
import DemoList from './lists';

export async function activate(context: ExtensionContext): Promise<void> {
  workspace.showMessage(`coc-toml works!`);

  let p = path.resolve(context.asAbsolutePath(path.join("dist", "server.js")));

  let serverOpts: client.ServerOptions = {
    run: { module: p, transport: client.TransportKind.ipc },
    debug: { module: p, transport: client.TransportKind.ipc },
  };

  context.subscriptions.push(
    commands.registerCommand('coc-toml.Command', async () => {
      workspace.showMessage(`coc-toml Commands works!`);
    }),

    listManager.registerList(new DemoList(workspace.nvim)),

    sources.createSource({
      name: 'coc-toml completion source', // unique id
      shortcut: '[CS]', // [CS] is custom source
      priority: 1,
      triggerPatterns: [], // RegExp pattern
      doComplete: async () => {
        const items = await getCompletionItems();
        return items;
      },
    }),

    workspace.registerKeymap(
      ['n'],
      'coc-toml-keymap',
      async () => {
        workspace.showMessage(`registerKeymap`);
      },
      { sync: false }
    ),

    workspace.registerAutocmd({
      event: 'InsertLeave',
      request: true,
      callback: () => {
        workspace.showMessage(`registerAutocmd on InsertLeave`);
      },
    })
  );
}

async function getCompletionItems(): Promise<CompleteResult> {
  return {
    items: [
      {
        word: 'TestCompletionItem 1',
      },
      {
        word: 'TestCompletionItem 2',
      },
    ],
  };
}
