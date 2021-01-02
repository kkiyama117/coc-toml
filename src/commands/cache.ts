import { ExtensionContext, LanguageClient, workspace } from 'coc.nvim';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

import config from '../config';

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

    workspace.showMessage('The cache directory has been cleared.');
  };
}

export function downloadSchemas(
  _c: LanguageClient,
  ctx: ExtensionContext
): any {
  return async () => {
    const statusItem = workspace.createStatusBarItem(0, { progress: true });
    ctx.subscriptions.push(statusItem);
    statusItem.text = 'Downloading Schemas.';
    statusItem.show();
    if (!config.repositoryEnabled) {
      workspace.showMessage('Schema repository is disabled in the settings.');
      if(config.debug){
        await workspace.echoLines([JSON.stringify(config)])

      }
      statusItem.hide();
      return;
    }

    await config.reset();

    if (!config.indexUrl) {
      workspace.showMessage(
        'Schema repository is not available in the settings.'
      );
      statusItem.hide();
      return;
    }

    statusItem.text = 'Fetching schema index';

    try {
      const index = await fetch(config.indexUrl).then((res) => res.json());

      if (!index?.schemas) {
        throw new Error('invalid index JSON');
      }

      await fs.promises.writeFile(
        path.join(ctx.storagePath, 'schema_index.json'),
        JSON.stringify(index)
      );

      const schemaCount: number = index.schemas?.length ?? 0;
      let schemaDone: number = 0;

      const schemasPath = path.join(ctx.storagePath, 'schemas');

      await fs.promises.mkdir(schemasPath, { recursive: true });

      // FIXME: maybe do this concurrently?
      for (let i = 0; i < schemaCount; i++) {
        const schemaMeta = index.schemas[i];
        try {
          const schema = await fetch(schemaMeta.url).then((res) => res.json());

          await fs.promises.writeFile(
            path.join(schemasPath, `${schemaMeta.urlHash}.json`),
            JSON.stringify({
              url: schemaMeta.url,
              schema: schema,
            })
          );

          schemaDone += 1;
        } catch (e) {
          // TODO: handle this better.
          console.warn(e);
        }

        statusItem.text = `Downloaded schema (${i}/${schemaCount}).`;

        workspace.showMessage(
          `Updated ${schemaDone}/${schemaCount} schemas from the repository.`
        );
      }
      statusItem.hide();
    } catch (e) {
      console.error(e);
      workspace.showMessage('Failed to download schemas.');
    }
  };
}
