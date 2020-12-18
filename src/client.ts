import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  StaticFeature,
  TransportKind,
  workspace,
} from 'coc.nvim';
import { ClientCapabilities } from 'vscode-languageserver-protocol';

class ExperimentalFeatures implements StaticFeature {
  fillClientCapabilities(capabilities: ClientCapabilities): void {
    const caps: any = capabilities.experimental ?? {};
    caps.snippetTextEdit = false;
    caps.resolveCodeAction = false;
    caps.statusNotification = false;
    capabilities.experimental = caps;
  }
  initialize(): void {}
}

export function createClient(p: string): LanguageClient {
  const serverOpts: ServerOptions = {
    run: { module: p, transport: TransportKind.ipc },
    debug: { module: p, transport: TransportKind.ipc },
  };
  const outputChannel = workspace.createOutputChannel(
    'Taplo Language Server Trace'
  );
  const clientOpts: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'toml' },
      { scheme: 'file', language: 'cargoLock' },
    ],

    initializationOptions: {
      configuration: workspace.getConfiguration().get('toml'),
    },

    synchronize: {
      configurationSection: 'toml',
      fileEvents: [
        workspace.createFileSystemWatcher('**/.toml'),
        workspace.createFileSystemWatcher('**/Cargo.lock'),
      ],
    },
    outputChannel,
  };

  // Create client for toml
  const client = new LanguageClient(
    'toml',
    'toml language server',
    serverOpts,
    clientOpts
  );

  client.registerProposedFeatures();
  client.registerFeature(new ExperimentalFeatures());

  return client;
}
