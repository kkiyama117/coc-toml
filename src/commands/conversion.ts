import { Methods } from '../requestExt';
import { LanguageClient, workspace, window } from 'coc.nvim';
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
    if (!range) {
      window.showMessage('Document and range are not selected', 'error');
      return;
    }

    const text: string = doc.textDocument.getText(range);
    if (text.trim().length === 0) {
      return;
    }

    const params: Methods.TomlToJson.Params = {
      text: text,
    };

    const res = await client.sendRequest<Methods.TomlToJson.Response>(
      Methods.TomlToJson.METHOD,
      params
    );

    const errLines: string[] = [];
    if (res.errors?.length ?? 0 !== 0) {
      errLines.push(`Selection Parse Errors in toml:`);
      for (const err of res.errors!) {
        errLines.push(`${err}`);
      }

      const show = await window.showQuickpick(
        ['Yes', 'No'],
        'Show details of error'
      );

      if (show === 0) {
        await window.echoLines(errLines);
      }
      return;
    }

    if (!res.text) {
      window.showMessage(`The response shouldn't be empty, but it is.`);

      const show = await window.showQuickpick(
        ['Yes', 'No'],
        'Show details of error'
      );

      if (show === 0) {
        await window.echoLines(errLines);
      }

      return;
    }

    await workspace.nvim.command('new').then(async () => {
      const buf = await workspace.nvim.buffer;
      buf.setLines(res.text.split('\n'), { start: 0, end: -1 });
    });
    window.showMessage('JSON has been generated!');
  };
}

export function jsonToToml(client: LanguageClient): any {
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
    if (!range) {
      window.showMessage('Document and range are not selected', 'error');
      return;
    }

    const text: string = doc.textDocument.getText(range);
    if (text.trim().length === 0) {
      return;
    }

    const params: Methods.JsonToToml.Params = {
      text: text,
    };

    const res = await client.sendRequest<Methods.JsonToToml.Response>(
      Methods.JsonToToml.METHOD,
      params
    );

    if (res.error) {
      const show = await window.showQuickpick(
        ['Yes', 'No'],
        'Show details of error'
      );

      if (show === 0) {
        await window.echoLines([res.error]);
      }
      return;
    }

    if (!res.text) {
      window.showMessage(`The response shouldn't be empty, but it is.`);

      const show = await window.showQuickpick(
        ['Yes', 'No'],
        'Show details of error'
      );

      if (show === 0) {
        await window.echoLines([res.error]);
      }

      return;
    }

    await workspace.nvim.command('new').then(async () => {
      const buf = await workspace.nvim.buffer;
      buf.setLines(res.text.split('\n'), { start: 0, end: -1 });
    });
    window.showMessage('JSON has been generated!');
  };
}
