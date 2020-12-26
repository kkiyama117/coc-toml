import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  StaticFeature,
  TransportKind,
  workspace,
} from 'coc.nvim';
import { ClientCapabilities } from 'vscode-languageserver-protocol';

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
    middleware: {
        workspace: {
            configuration: (_params, _token, _next) => {
                return [
                    workspace.getConfiguration().get('toml')
                ]
            }
        }
    }
  };

  // Create client for toml
  const client = new LanguageClient(
    'toml',
    'toml language server',
    serverOpts,
    clientOpts
  );

  client.registerProposedFeatures();

  return client;
}
