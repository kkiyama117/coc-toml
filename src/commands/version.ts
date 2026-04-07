import { window } from 'coc.nvim';
import { execSync } from 'child_process';
import { TombiBin } from '../bootstrap';

export function showVersion(tombiBin: TombiBin): any {
  return async () => {
    try {
      const result = execSync(`${tombiBin.command} --version`, {
        encoding: 'utf-8',
      }).trim();
      window.showInformationMessage(result);
    } catch (e) {
      window.showErrorMessage(`Failed to get tombi version: ${e}`);
    }
  };
}
