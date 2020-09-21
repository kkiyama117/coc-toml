import {
  commands,
  ExtensionContext,
  listManager,
  sources,
  events,
  LanguageClient,
  ServerOptions,
  services,
  LanguageClientOptions,
  workspace,
} from 'coc.nvim';
import * as path from 'path';
// import { registerCommands } from "./commands";
// import { MessageWithOutput } from "./requestExt";
import DemoList from './lists';
import cocTomlAutoCmd from './auto_cmd';
import sourceConfig from './toml_source_config';
import getServerOptions from './configs/server_options';
import getClientOptions from './configs/client_options';

export async function activate(context: ExtensionContext): Promise<void> {
  // define variables
  const { subscriptions, logger } = context;
  const fileSchemaErrors = new Map<string, string>();
  const config = workspace.getConfiguration().get('coc-toml') as any;

  // Don't activate if disabled
  if (!config.enabled) {
    logger.log('configs.enabled: false');
    workspace.showMessage(
      'activate stopped because of: configs.enabled is false'
    );
  }

  // When opening buffer, get doc and find errors
  events.on(
    'BufEnter',
    (bufnr) => {
      const doc = workspace.getDocument(bufnr);
      if (!doc) return;
      const msg = fileSchemaErrors.get(doc.uri);
      if (msg) workspace.showMessage(`Schema error: ${msg}`, 'warning');
    },
    null,
    subscriptions
  );

  // Create the language client and start the client.
  const serverPath = path.resolve(
    context.asAbsolutePath(path.join('lib', 'server.js'))
  );
  // Options to control the language server
  const serverOptions: ServerOptions = getServerOptions(serverPath);
  // Options to control the language client
  const clientOptions: LanguageClientOptions = getClientOptions(
    config,
    fileSchemaErrors
  );

  // Create client for toml
  const client = new LanguageClient(
    'toml',
    'toml language server',
    serverOptions,
    clientOptions
  );

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(services.registLanguageClient(client));
  client.onReady().then(() => {
    // WIP, get schema
  });

  // show loading status.
  const statusItem = workspace.createStatusBarItem(0, { progress: true });
  subscriptions.push(statusItem);

  context.subscriptions.push(
    commands.registerCommand('coc-toml.Command', async () => {
      workspace.showMessage(`coc-toml Commands works!`);
    }),

    listManager.registerList(new DemoList(workspace.nvim)),

    // add source completions
    sources.createSource(sourceConfig),

    // add autocmd
    workspace.registerAutocmd(cocTomlAutoCmd(workspace))
  );
}
