import {
  DidChangeConfigurationNotification,
  TextDocument,
  Position,
  CompletionContext,
  CancellationToken,
  CompletionItem,
  CompletionList,
  CompletionItemKind,
  Diagnostic,
  RequestType
} from 'vscode-languageserver-protocol';
import {
  Uri,
  commands,
  CompleteResult,
  ExtensionContext,
  listManager,
  sources,
  events,
  extensions,
  LanguageClient,
  ServerOptions,
  services,
  TransportKind,
  LanguageClientOptions,
  ServiceStat,
  ProvideCompletionItemsSignature,
  ResolveCompletionItemSignature,
  HandleDiagnosticsSignature,
  workspace
} from 'coc.nvim';
import * as path from 'path';
// import { registerCommands } from "./commands";
// import { MessageWithOutput } from "./requestExt";
import DemoList from './lists';

export async function activate(context: ExtensionContext): Promise<void> {
  // define variables
  let { subscriptions, logger } = context
  let fileSchemaErrors = new Map<string, string>()

  // check buffer data
  events.on('BufEnter', bufnr => {
    let doc = workspace.getDocument(bufnr);
    if (!doc) return;
    let msg = fileSchemaErrors.get(doc.uri);
    if (msg) workspace.showMessage(`Schema error: ${msg}`, 'warning');
  }, null, subscriptions);

  // Create the language client and start the client.
  let p = path.resolve(context.asAbsolutePath(path.join('lib', 'server.js')));
  let serverOptions: ServerOptions = {
    run: { module: p, transport: TransportKind.ipc },
    debug: { module: p, transport: TransportKind.ipc }
  };
  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "toml" },
      { scheme: "file", language: "cargoLock" },
    ],

    initializationOptions: {
      configuration: workspace.getConfiguration().get("coc-toml"),
    },

    synchronize: {
      configurationSection: "coc-toml",
      fileEvents: [
        workspace.createFileSystemWatcher("**/.toml"),
        workspace.createFileSystemWatcher("**/Cargo.lock"),
      ],
    },
  };
  let client = new LanguageClient(
    'toml',
    'toml language server',
    serverOptions,
    clientOptions
  );
  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(
    services.registLanguageClient(client),
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
      }
    }),

    workspace.registerAutocmd({
      event: 'InsertLeave',
      request: true,
      callback: () => {
        workspace.showMessage(`registerAutocmd on InsertLeave`);
      }
    })
  );
}

async function getCompletionItems(): Promise<CompleteResult> {
  return {
    items: [
      {
        word: 'TestCompletionItem 1'
      },
      {
        word: 'TestCompletionItem 2'
      }
    ]
  };
}
