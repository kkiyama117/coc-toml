import { ExtensionContext, services, window, commands } from 'coc.nvim';

import config from './config';
import { findTombiBinary, checkUpdate } from './bootstrap';
import { createClient } from './client';
import { registerCommand } from './commands';
import { refreshCache } from './commands/cache';
import { showVersion } from './commands/version';
import { selectSchema } from './commands/selectSchema';
import { registerUserSchemas } from './userSchemas';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!config.enabled) {
    window.showWarningMessage('tombi is disabled (tombi.enabled is false)');
    return;
  }

  const tombiBin = await findTombiBinary(context);
  if (!tombiBin) {
    return;
  }

  const client = createClient(tombiBin);
  context.subscriptions.push(services.registLanguageClient(client));

  registerCommand(context, client, 'refreshCache', refreshCache);
  registerCommand(context, client, 'selectSchema', selectSchema);

  context.subscriptions.push(
    commands.registerCommand(
      'tombi.showLanguageServerVersion',
      showVersion(tombiBin),
    ),
  );
  context.subscriptions.push(
    commands.registerCommand('tombi.restartLanguageServer', async () => {
      await client.stop();
      client.start();
      window.showInformationMessage('Tombi Language Server restarted.');
    }),
  );

  // Register user-defined schemas from tombi.schemas (non-blocking)
  registerUserSchemas(client, config.schemas).catch((e) => {
    window.showWarningMessage(`tombi.schemas registration failed: ${e}`);
  });

  // Background update check (non-blocking)
  if (tombiBin.source === 'stored') {
    checkUpdate(context);
  }
}
