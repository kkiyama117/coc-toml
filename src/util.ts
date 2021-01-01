import { Range } from 'vscode-languageserver-types';
import { Document } from 'coc.nvim';

export function allRange(doc: Document): Range {
  return Range.create(
    0,
    0,
    doc.lineCount - 1,
    doc.getline(doc.lineCount - 1).length
  );
}
