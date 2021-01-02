import { commands, ExtensionContext, LanguageClient } from 'coc.nvim';

export function registerCommand(
  context: ExtensionContext,
  client: LanguageClient,
  name: string,
  cmd: (
    arg0: LanguageClient,
    arg1: ExtensionContext
  ) => (...args: any[]) => Promise<void>
) {
  const fullName = `toml.${name}`;
  const d = commands.registerCommand(fullName, cmd(client, context));
  client.onReady().then(() => {
    context.subscriptions.push(d);
  });
}
