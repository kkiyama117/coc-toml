// Various debug commands

import { Methods } from '../requestExt';
import { LanguageClient, workspace } from 'coc.nvim';

export function syntaxTree(client: LanguageClient): any {
  return async () => {
    const doc = await workspace.document;
    const params: Methods.SyntaxTree.Params = {
      uri: doc.uri.toString()
    };

    const res = await client.sendRequest<Methods.SyntaxTree.Response>(
      Methods.SyntaxTree.METHOD,
      params
    );
    await workspace.nvim.command('tabnew').then(async () => {
      const buf = await workspace.nvim.buffer;
      buf.setLines(res.text.split('\n'), { start: 0, end: -1 });
    });
  };
}
