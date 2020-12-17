import * as requestExt from '../requestExt';
import { LanguageClient, workspace } from 'coc.nvim';
import { Range } from 'vscode-languageserver-types';
import { allRange } from '../util';

export function tomlToJson(client: LanguageClient): any {
  return async () => {
    const doc = await workspace.document;
    const mode = await workspace.nvim.call('visualmode');
    let range: Range | null;
    if (mode) {
      range = await workspace.getSelectedRange(mode, doc);
    } else {
      // Select all range
      range = allRange(doc);
    }
    const text: string = doc.textDocument.getText(range);
    const params: requestExt.TomlToJson.Params = {
      text: text,
    };

    const res = await client.sendRequest<requestExt.TomlToJson.Response>(
      requestExt.TomlToJson.METHOD,
      params
    );

    const errLines: string[] = [];
    if (res.errors?.length ?? 0 !== 0) {
      errLines.push(`Selection Parse Errors in toml:`);
      for (const err of res.errors!) {
        errLines.push(`${err}`);
      }

      const show = await workspace.showQuickpick(['Yes', 'No'], 'Show Details');

      if (show === 0) {
        await workspace.echoLines(errLines);
      }
      return;
    }

    if (!res.text) {
        workspace.showMessage(
            `The response shouldn't be empty, but it is.`
        );

      const show = await workspace.showQuickpick(['Yes', 'No'], 'Show Details');

      if (show === 0) {
        await workspace.echoLines(errLines);
      }

      return;
    }

    await workspace.nvim.command('tabnew').then(async () => {
      const buf = await workspace.nvim.buffer;
      buf.setLines(res.text.split('\n'), { start: 0, end: -1 });
    });
    workspace.showMessage('JSON has been generated!');
  };
}
