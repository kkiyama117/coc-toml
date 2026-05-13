import { LanguageClient, window } from 'coc.nvim';
import { SchemaEntry } from './config';
import { Methods } from './requestExt';

export async function registerUserSchemas(
  client: LanguageClient,
  schemas: SchemaEntry[],
): Promise<void> {
  if (schemas.length === 0) return;

  await client.onReady();

  for (const schema of schemas) {
    if (!schema.uri || !Array.isArray(schema.fileMatch)) {
      window.showWarningMessage(
        `Skipping invalid tombi.schemas entry: ${JSON.stringify(schema)}`,
      );
      continue;
    }

    try {
      await client.sendNotification(Methods.AssociateSchema.METHOD, {
        uri: schema.uri,
        fileMatch: schema.fileMatch,
        title: schema.title,
        description: schema.description,
        tomlVersion: schema.tomlVersion,
        force: true,
      } as Methods.AssociateSchema.Params);
    } catch (e) {
      window.showWarningMessage(
        `Failed to associate schema ${schema.uri}: ${e}`,
      );
    }
  }
}
