import { ExtensionContext, workspace } from 'coc.nvim';

import { Config } from './config';
import { Ctx } from './ctx';
import { tomlToJson } from './commands/tomlToJson';
import { syntaxTree } from './commands/syntaxTree';

// TODO: find reason for bug
export let globalConfig: Config;

export async function activate(context: ExtensionContext): Promise<void> {
  globalConfig = new Config();

  const ctx = new Ctx(context, globalConfig);
  // Don't activate if disabled
  if (!globalConfig.enabled) {
    logger.log('configs.enabled: false');
    workspace.showMessage(
      'activate stopped because of: configs.enabled is false'
    );
  }

  if (globalConfig.debug) {
    ctx.registerCommand('configList', (ctx) => {
      return async () => {
        workspace.showMessage(JSON.stringify(ctx.config));
      };
    });
  }
  ctx.registerCommand('tomlToJson', tomlToJson);
  ctx.registerCommand('syntaxTree', syntaxTree);
  ctx.registerCommand('reload', (ctx) => {
    return async () => {
      workspace.showMessage(`Reloading taplo...`);

      for (const sub of ctx.subscriptions) {
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

  await ctx.startServer();
}
