import path from 'path';

export function isAbsolutePath(p: string): boolean {
  return (
    path.resolve(p) === path.normalize(p).replace(RegExp(path.sep + '$'), '')
  );
}
