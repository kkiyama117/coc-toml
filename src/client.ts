import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  workspace,
} from 'coc.nvim';

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
        // Replace `toml` to `evenBetterToml` to communicate to `taplo/lsp` correctly.
        configuration: (params, token, next) => {
          params.items = params.items.map((item) => ({
            ...item,
            section: (item.section ?? '').replace('evenBetterToml', 'toml'),
          }));
          return next(params, token);
        },
      },
    },
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
