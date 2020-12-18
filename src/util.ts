import path from 'path';
import { Range } from 'vscode-languageserver-types';
import { Document } from 'coc.nvim';
import { Position } from 'vscode-languageserver-protocol';

export function isAbsolutePath(p: string): boolean {
  return (
    path.resolve(p) === path.normalize(p).replace(RegExp(path.sep + '$'), '')
  );
}

export function allRange(doc: Document): Range {
  return Range.create(
    0,
    0,
    doc.lineCount - 1,
    doc.getline(doc.lineCount - 1).length
  );
}
