import { commands, ExtensionContext, LanguageClient } from 'coc.nvim';

export function registerCommand(
  context: ExtensionContext,
  client: LanguageClient,
  name: string,
  cmd: (
    client: LanguageClient,
    context: ExtensionContext,
  ) => (...args: any[]) => Promise<void>,
) {
  const fullName = `tombi.${name}`;
  const d = commands.registerCommand(fullName, cmd(client, context));
  context.subscriptions.push(d);
}
