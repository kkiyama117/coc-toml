import { LanguageClient, window } from 'coc.nvim';
import { Methods } from '../requestExt';

export function refreshCache(client: LanguageClient): any {
  return async () => {
    try {
      const result = await client.sendRequest<Methods.RefreshCache.Response>(
        Methods.RefreshCache.METHOD,
        {}
      );
      if (result) {
        window.showInformationMessage('Cache refreshed successfully.');
      } else {
        window.showWarningMessage('Failed to refresh cache.');
      }
    } catch (e) {
      window.showErrorMessage(`Failed to refresh cache: ${e}`);
    }
  };
}
