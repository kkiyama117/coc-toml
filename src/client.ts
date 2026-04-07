import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  window,
  workspace,
} from 'coc.nvim';
import { TombiBin } from './bootstrap';
import config from './config';

export function createClient(tombiBin: TombiBin): LanguageClient {
  const args = [...tombiBin.args, 'lsp', ...config.args];

  const serverOpts: ServerOptions = {
    command: tombiBin.command,
    args,
    options: {
      env: {
        ...process.env,
        NO_COLOR: '1',
        ...config.env,
      },
    },
  };

  const outputChannel = window.createOutputChannel('Tombi Language Server');

  const clientOpts: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'toml' },
      { scheme: 'file', language: 'cargoLock' },
    ],
    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher('**/tombi.toml'),
        workspace.createFileSystemWatcher('**/.tombi.toml'),
        workspace.createFileSystemWatcher('**/pyproject.toml'),
      ],
    },
    outputChannel,
  };

  return new LanguageClient(
    'tombi',
    'Tombi Language Server',
    serverOpts,
    clientOpts
  );
}
