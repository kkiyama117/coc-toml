import {
  commands,
  ExtensionContext,
  LanguageClient,
  MsgTypes,
  services,
  workspace,
} from 'coc.nvim';

import config from './config';
import { tomlToJson } from './commands/tomlToJson';
import { syntaxTree } from './commands/syntaxTree';
import fs from 'fs';
import { Context } from 'vm';
import { createClient } from './client';
import path from 'path';
import { MessageWithOutput } from './requestExt';
import {
  CacheSchema,
  ConfigFileChanged,
  GetCachedSchema,
  UpdateBuiltInSchemas,
  WatchConfigFile,
} from './requestExt';
import { TextEncoder } from 'util';
import deepEqual from 'deep-equal';
import { isAbsolutePath } from './util';

// TODO: Divide files
/// side effects should be capsuled into one place.

let extensionContext: ExtensionContext;
let taploConfigWatcher: fs.FSWatcher | undefined;
let serverTaploConfigWatcher: fs.FSWatcher | undefined;

export async function activate(context: ExtensionContext): Promise<void> {
  // Don't activate if disabled
  if (!config.enabled) {
    workspace.showMessage('activate stopped because of: toml.enabled is false');
    return;
  }
  // Create lsp client with server process
  const serverPath = context.asAbsolutePath(path.join('lib', 'server.js'));
  extensionContext = context;
  let client = createClient(serverPath);

  // register commands
  if (config.debug) {
    registerCommand(context, client, 'configList', (_) => async () => {
      workspace.showMessage(JSON.stringify(config));
    });
  }

  registerCommand(context, client, 'tomlToJson', tomlToJson);
  registerCommand(context, client, 'syntaxTree', syntaxTree);
  registerCommand(context, client, 'reload', () => {
    return async () => {
      workspace.showMessage(`Reloading taplo...`);

      for (const sub of context.subscriptions) {
        try {
          sub.dispose();
        } catch (e) {
          console.error(e);
        }
      }

      await activate(context);

      workspace.showMessage(`Reloaded taplo`);
    };
  });

  // wait onReady
  context.subscriptions.push(services.registLanguageClient(client));
  // context.subscriptions.push(output, client.start());
  if (config.showNotification) {
    // show loading status.
    const statusItem = workspace.createStatusBarItem(0, { progress: true });
    context.subscriptions.push(statusItem);
    statusItem.text = 'TOML loading...';
    statusItem.show();
    await client.onReady();
    statusItem.hide();
  } else {
    await client.onReady();
  }
  // auto reloading when config is changed
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((cfgEvent) => {
      if (
        cfgEvent.affectsConfiguration('toml.taploConfig') ||
        cfgEvent.affectsConfiguration('toml.taploConfigEnabled')
      ) {
        watchConfigFile(client);
      }
    })
  );

  watchConfigFile(client);

  client.onNotification(MessageWithOutput.METHOD, showMessage);
  client.onNotification(UpdateBuiltInSchemas.METHOD, updateAssociations);
  // TODO: Check extensionContent is needed(instead of `context`)
  client.onNotification(CacheSchema.METHOD, cacheSchemaGen(extensionContext));
  client.onNotification(
    WatchConfigFile.METHOD,
    watchServerTaploConfigFileGen(client)
  );
  // TODO: Check extensionContent is needed(instead of `context`)
  client.onRequest(
    GetCachedSchema.METHOD,
    getCachedSchemaGen(extensionContext)
  );
}

function showMessage(params: MessageWithOutput.Params) {
  const _trans = (a: MessageWithOutput.MessageKind): MsgTypes | undefined => {
    switch (a) {
      case MessageWithOutput.MessageKind.Info:
        return undefined;
      case MessageWithOutput.MessageKind.Warn:
        return 'warning';
      case MessageWithOutput.MessageKind.Error:
        return 'error';
      default:
        return undefined;
    }
  };
  workspace.showMessage(params.message, _trans(params.kind));
}

function registerCommand(
  context: Context,
  client: LanguageClient,
  name: string,
  cmd: (arg0: LanguageClient) => (...args: any[]) => Promise<void>
) {
  const fullName = `toml.${name}`;
  const d = commands.registerCommand(fullName, cmd(client));
  client.onReady().then(() => {
    context.subscriptions.push(d);
  });
}

function watchConfigFile(c: LanguageClient) {
  taploConfigWatcher?.close();
  taploConfigWatcher = undefined;

  let cfgPath: string | undefined = config.taploConfig;

  if (typeof cfgPath === 'string' && cfgPath.length > 0) {
    let p = cfgPath;

    if (!isAbsolutePath(p)) {
      let wsPath = workspace.workspaceFolders[0]?.uri;

      if (typeof wsPath !== 'undefined') {
        return;
      }

      p = path.join(wsPath, p);
    }

    taploConfigWatcher = fs.watch(p);
    taploConfigWatcher.on('change', () => {
      c.sendNotification(ConfigFileChanged.METHOD);
    });
  }
}

const watchServerTaploConfigFileGen = (c: LanguageClient) => (
  params: WatchConfigFile.Params
) => {
  serverTaploConfigWatcher?.close();
  serverTaploConfigWatcher = undefined;

  let ws = workspace.workspaceFolders[0]?.uri;

  if (typeof ws === 'undefined') {
    return;
  }

  serverTaploConfigWatcher = fs.watch(params.configPath, () => {
    c.sendNotification(ConfigFileChanged.METHOD);
  });
};

// cache schema ============================================================
function schemaPath(context: ExtensionContext): string | undefined {
  if (config.debug) {
    console.error(context.storagePath);
  }
  return path.join(context.storagePath, 'schemas.json');
}

const _schemaData = async (schemaPath: string) => {
  let schemas: { [key: string]: string } = {};
  try {
    schemas = JSON.parse(await workspace.readFile(schemaPath));
  } catch (e) {
    // Doesn't yet exist.
  }
  return schemas;
};

const cacheSchemaGen = (context: ExtensionContext) => async (
  params: CacheSchema.Params
) => {
  const schemas = await _schemaData(schemaPath(context));
  schemas[params.schemaUri] = params.schemaJson;
  await fs.writeFile(
    schemaPath(context),
    new TextEncoder().encode(JSON.stringify(schemas)),
    (_err: any) => {
      workspace.showMessage('error occurred when caching schema', 'error');
    }
  );
};

const getCachedSchemaGen = (context: ExtensionContext) => async (
  params: GetCachedSchema.Params
): Promise<GetCachedSchema.Response> => ({
  schemaJson: (await _schemaData(schemaPath(context)))[params.schemaUri],
});

async function updateAssociations(params: UpdateBuiltInSchemas.Params) {
  const config = workspace.getConfiguration('toml');

  type Choice = 'ask' | 'always' | 'never';
  const updateNew: Choice = config.addNewBuiltins;

  const removeOld: Choice = config.removeOldBuiltins;

  if (updateNew === 'never' && removeOld === 'never') {
    return;
  }
  const defaultAssociations: any = config.defaultAssociations;
  let currentAssociations: any = config.currentAssociations;

  if (deepEqual(defaultAssociations, currentAssociations, { strict: true })) {
    // default values, nothing to do
    if (config.debug) {
      workspace.showMessage('associations is not changed.');
    }
    return;
  }

  if (updateNew !== 'never') {
    const toAdd: any = {};
    let needUpdate = false;

    for (const key of Object.keys(params.associations)) {
      const newAssoc = params.associations[key];

      let found = false;
      for (const currentKey of Object.keys(currentAssociations)) {
        const currentAssoc = currentAssociations[currentKey];

        if (newAssoc === currentAssoc) {
          found = true;
          break;
        }
      }

      if (!found) {
        toAdd[key] = newAssoc;
        needUpdate = true;
      }
    }
    if (needUpdate) {
      // update
      const msg =
        'There are new built-in schemas available. Update the associations?';
      if (updateNew === 'ask') {
        const action = await workspace.showQuickpick(
          ['Update', 'Never Update', 'Always Update'],
          msg
        );
        switch (action) {
          case 0:
            await config.setAssociations(
              {
                ...currentAssociations,
                ...toAdd,
              },
              true
            );
            break;
          case 1:
            await config.setAddNewBuiltins('never', true);
            break;
          case 2:
            await config.setAddNewBuiltins('always', true);
            await config.setAssociations(
              {
                ...currentAssociations,
                ...toAdd,
              },
              true
            );
            break;
        }
      } else {
        // always update
        await config.setAssociations(
          {
            ...currentAssociations,
            ...toAdd,
          },
          true
        );
      }
    }
  }

  currentAssociations = config.currentAssociations;

  if (deepEqual(defaultAssociations, currentAssociations, { strict: true })) {
    // default values, nothing to do
    return;
  }

  if (removeOld !== 'never') {
    const finalAssociations: any = {};
    let needRemove = false;

    const deprecated = [
      (val: string): boolean => val.startsWith('toml_builtin://'),
    ];

    for (const key of Object.keys(currentAssociations)) {
      const currentAssoc: string = currentAssociations[key];

      let toRemove = false;
      for (const isDeprecated of deprecated) {
        if (isDeprecated(currentAssoc)) {
          toRemove = true;
          needRemove = true;
          break;
        }
      }

      if (!toRemove) {
        finalAssociations[key] = currentAssoc;
      }
    }

    if (needRemove) {
      if (removeOld === 'ask') {
        const msg =
          'There are deprecated built-in schemas in associations. Remove them?';
        const action = await workspace.showQuickpick(
          ['Remove', 'Never Remove', 'Always Remove'],
          msg
        );

        switch (action) {
          case 0:
            await config.setAssociations(finalAssociations, true);
            break;
          case 1:
            await config.setRemoveOldBuiltins('never', false);
            break;
          case 2:
            await config.setRemoveOldBuiltins('always', false);
            await config.setAssociations(finalAssociations, true);
            break;
        }
      } else {
        await config.setAssociations(finalAssociations, true);
      }
    }
  }
}
