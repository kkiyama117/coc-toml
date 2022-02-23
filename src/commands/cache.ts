import { ExtensionContext, LanguageClient, workspace, window } from 'coc.nvim';
import fs from 'fs';
import path from 'path';

import config from '../config';
import fetch from 'node-fetch';

export function clearCache(_c: LanguageClient, ctx: ExtensionContext): any {
  return async () => {
    try {
      await fs.promises.rmdir(ctx.storagePath, {
        recursive: true,
      });
    } catch (e) {
      // It might not exist.
      console.warn(e);
    }
    await fs.promises.mkdir(ctx.storagePath, {
      recursive: true,
    });

    window.showMessage('The cache directory has been cleared.');
  };
}

export function downloadSchemas(
  _c: LanguageClient,
  ctx: ExtensionContext
): any {
  return async () => {
    const statusItem = window.createStatusBarItem(0, { progress: true });
    ctx.subscriptions.push(statusItem);
    statusItem.text = 'Downloading Schemas.';
    statusItem.show();
    if (!config.repositoryEnabled) {
      window.showMessage('Schema repository is disabled in the settings.');
      statusItem.hide();
      return;
    }

    await config.reset();

    if (!config.indexUrl) {
      window.showMessage('Schema repository is not available in the settings.');
      statusItem.hide();
      return;
    }

    statusItem.text = 'Fetching schema index';

    try {
      const index: TaploSchemas = await fetch(config.indexUrl).then((res) =>
        res.json()
      );

      if (!index?.schemas) {
        window.showMessage('invalid index JSON');
      }

      await fs.promises.writeFile(
        path.join(ctx.storagePath, 'schema_index.json'),
        JSON.stringify(index)
      );

      const schemaCount: number = index.schemas?.length ?? 0;

      const schemasPath = path.join(ctx.storagePath, 'schemas');

      await fs.promises.mkdir(schemasPath, { recursive: true });

      const promises: Promise<boolean>[] = (index.schemas as TaploSchema[]).map(
        async (schemaMeta) => {
          try {
            const schema: TaploSchema = await fetch(schemaMeta.url).then(
              (res) => res.json()
            );

            await fs.promises.writeFile(
              path.join(schemasPath, `${schemaMeta.urlHash}.json`),
              JSON.stringify({
                url: schemaMeta.url,
                schema: schema,
              })
            );
          } catch (e) {
            // TODO: handle this better.
            console.warn(e);
            return false;
          }
          statusItem.text = `Downloaded schema (${schemaMeta.title}).`;
          window.showMessage(
            `Updated ${schemaMeta.title} schema from the repository.`
          );
          return true;
        }
      );
      const sucessed = await Promise.all(promises);
      window.showMessage(
        `Updated ${
          sucessed.filter(Boolean).length
        }/${schemaCount} schemas from the repository.`
      );
      statusItem.hide();
    } catch (e) {
      console.error(e);
      window.showMessage('Failed to download schemas.');
    }
  };
}

type TaploSchemas = { schemas: TaploSchema[] };
type TaploSchema = {
  title: string;
  description: string;
  updated: string;
  url: string;
  urlHash: string;
  authors: string[];
  patterns: string[];
};
