import {
  commands,
  ExtensionContext,
  LanguageClient,
  MsgTypes,
  services,
  workspace,
} from 'coc.nvim';
import config from './config';
import { tomlToJson } from './commands/tomlToJson';
import { syntaxTree } from './commands/syntaxTree';
import fs from 'fs';
import { Context } from 'vm';
import { createClient } from './client';
import path from 'path';
import { MessageWithOutput, CachePath } from './requestExt';
import { TextEncoder } from 'util';
import { isAbsolutePath } from './util';

// TODO: Divide files
/// side effects should be capsuled into one place.

let extensionContext: ExtensionContext;
let taploConfigWatcher: fs.FSWatcher | undefined;
let serverTaploConfigWatcher: fs.FSWatcher | undefined;

export async function activate(context: ExtensionContext): Promise<void> {
  // Don't activate if disabled
  if (!config.enabled) {
    workspace.showMessage('activate stopped because of: toml.enabled is false');
    return;
  }
  // Create lsp client with server process
  const serverPath = context.asAbsolutePath(path.join('lib', 'server.js'));
  extensionContext = context;
  let client = createClient(serverPath);

  // register commands
  if (config.debug) {
    registerCommand(context, client, 'configList', (_) => async () => {
      workspace.showMessage(JSON.stringify(config));
    });
  }

  registerCommand(context, client, 'tomlToJson', tomlToJson);
  registerCommand(context, client, 'syntaxTree', syntaxTree);
  registerCommand(context, client, 'reload', () => {
    return async () => {
      workspace.showMessage(`Reloading taplo...`);

      for (const sub of context.subscriptions) {
        try {
          sub.dispose();
        } catch (e) {
          console.error(e);
        }
      }

      await activate(context);

      workspace.showMessage(`Reloaded taplo`);
    };
  });

  // wait onReady
  context.subscriptions.push(services.registLanguageClient(client));
  // context.subscriptions.push(output, client.start());
  if (config.showNotification) {
    // show loading status.
    const statusItem = workspace.createStatusBarItem(0, { progress: true });
    context.subscriptions.push(statusItem);
    statusItem.text = 'TOML loading...';
    statusItem.show();
    await client.onReady();
    statusItem.hide();
  } else {
    await client.onReady();
  }

  client.sendNotification(CachePath.METHOD, {
    path: path.join(context.storagePath, '.local.cache'),
  });
  client.onNotification(MessageWithOutput.METHOD, showMessage);
}

function showMessage(params: MessageWithOutput.Params) {
  const _trans = (a: MessageWithOutput.MessageKind): MsgTypes | undefined => {
    switch (a) {
      case MessageWithOutput.MessageKind.Info:
        return undefined;
      case MessageWithOutput.MessageKind.Warn:
        return 'warning';
      case MessageWithOutput.MessageKind.Error:
        return 'error';
      default:
        return undefined;
    }
  };
  workspace.showMessage(params.message, _trans(params.kind));
}

function registerCommand(
  context: Context,
  client: LanguageClient,
  name: string,
  cmd: (arg0: LanguageClient) => (...args: any[]) => Promise<void>
) {
  const fullName = `toml.${name}`;
  const d = commands.registerCommand(fullName, cmd(client));
  client.onReady().then(() => {
    context.subscriptions.push(d);
  });
}
