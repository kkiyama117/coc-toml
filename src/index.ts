import { ExtensionContext, MsgTypes, services, workspace,window } from 'coc.nvim';
import path from 'path';

import config, { Config } from './config';
import { createClient } from './client';
import { jsonToToml, tomlToJson } from './commands/conversion';
import { syntaxTree } from './commands/syntaxTree';
import { clearCache, downloadSchemas } from './commands/cache';
import { registerCommand } from './commands';
import { Methods } from './requestExt';

export async function activate(context: ExtensionContext): Promise<void> {
  // Don't activate if disabled
  if (!config.enabled) {
    window.showMessage('activate stopped because of: toml.enabled is false');
    return;
  }
  // Create lsp client with server process
  const serverPath = context.asAbsolutePath(path.join('lib', 'server.js'));
  let client = createClient(serverPath);

  // register commands
  if (config.debug) {
    registerCommand(context, client, 'configList', (_) => async () => {
      window.showMessage(JSON.stringify(config));
    });
  }

  registerCommand(context, client, 'tomlToJson', tomlToJson);
  registerCommand(context, client, 'jsonToToml', jsonToToml);
  registerCommand(context, client, 'syntaxTree', syntaxTree);
  registerCommand(context, client, 'clearCache', clearCache);
  registerCommand(context, client, 'downloadSchemas', downloadSchemas);

  // wait onReady
  context.subscriptions.push(services.registLanguageClient(client));
  await checkAssociations(config);
  if (config.showNotification) {
    // show loading status.
    const statusItem = window.createStatusBarItem(0, { progress: true });
    context.subscriptions.push(statusItem);
    statusItem.text = 'TOML loading...';
    statusItem.show();
    await client.onReady();
    statusItem.hide();
  } else {
    await client.onReady();
  }

  client.sendNotification(Methods.CachePath.METHOD, {
    path: path.join(context.storagePath),
  });
  client.onNotification(Methods.MessageWithOutput.METHOD, showMessage);
}

async function checkAssociations(config: Config) {
  const oldBuiltins = [
    'taplo://taplo@taplo.toml',
    'taplo://cargo@Cargo.toml',
    'taplo://python@pyproject.toml',
    'taplo://rust@rustfmt.toml',
  ];

  if (config.ignoreDeprecatedAssociations) {
    return;
  }

  const assoc = config.associations;

  if (!assoc) {
    return;
  }

  for (const k of Object.keys(assoc)) {
    const val = assoc[k];

    if (oldBuiltins.indexOf(val) !== -1) {
      window.showMessage(
        'Your schema associations reference schemas that are not bundled anymore and will not work.',
        'warning'
      );
      const c = await window.showQuickpick(['More Information', 'Ignore']);

      if (c === 0) {
        window.showMessage(
          'See https://taplo.tamasfe.dev/configuration/#official-schemas'
        );
      } else if (c === 1) {
        await config.setIgnoreDeprecatedAssociations(true, true);
      }
      break;
    }
  }
}

function showMessage(params: Methods.MessageWithOutput.Params) {
  const _trans = (
    a: Methods.MessageWithOutput.MessageKind
  ): MsgTypes | undefined => {
    switch (a) {
      case Methods.MessageWithOutput.MessageKind.Info:
        return undefined;
      case Methods.MessageWithOutput.MessageKind.Warn:
        return 'warning';
      case Methods.MessageWithOutput.MessageKind.Error:
        return 'error';
      default:
        return undefined;
    }
  };
  window.showMessage(params.message, _trans(params.kind));
}
