import {
  commands,
  Document,
  ExtensionContext,
  LanguageClient,
  MsgTypes,
  services,
  StatusBarItem,
  workspace,
} from 'coc.nvim';
import path from 'path';
import {
  Disposable,
  GenericNotificationHandler,
  Position,
} from 'vscode-languageserver-protocol';
// import { TextDocument } from 'vscode-languageserver-textdocument';
import { Config } from './config';
import { createClient } from './client';
import {
  CacheSchema,
  ConfigFileChanged,
  GetCachedSchema,
  MessageWithOutput,
  UpdateBuiltInSchemas,
  WatchConfigFile,
} from './requestExt';
import fs from 'fs';
import { isAbsolutePath } from './util';
import * as vscode_ls from 'vscode-languageserver-types';
import deepEqual from 'deep-equal';
import * as coc from 'coc.nvim';
import { Range } from 'vscode-languageserver-types';

// export type TomlDocument = TextDocument & { languageId: 'toml' };

// export function isTomlDocument(
//   document: TextDocument
// ): document is TomlDocument {
//   return document.languageId === 'toml';
// }

export type Cmd = (...args: any[]) => unknown;

export class Ctx {
  client!: LanguageClient;
  private readonly statusBar: StatusBarItem;
  // private statusBar: StatusBarItem;
  private taploConfigWatcher;
  private serverTaploConfigWatcher;

  constructor(
    private readonly extCtx: ExtensionContext,
    private readonly config: Config
  ) {
    this.statusBar = workspace.createStatusBarItem(10);
    this.statusBar.text = 'coc-toml';
    this.extCtx.subscriptions.push(this.statusBar);
  }

  registerCommand(name: string, factory: (ctx: Ctx) => Cmd) {
    const fullName = `coc-toml.${name}`;
    const cmd = factory(this);
    const d = commands.registerCommand(fullName, cmd);
    this.extCtx.subscriptions.push(d);
  }

  serverPath() {
    return this.extCtx.asAbsolutePath(path.join('lib', 'server.js'));
  }

  async startServer() {
    const client = createClient(this.serverPath());
    this.extCtx.subscriptions.push(services.registLanguageClient(client));

    if (this.config.showNotification) {
      // show loading status.
      const statusItem = workspace.createStatusBarItem(0, { progress: true });
      this.extCtx.subscriptions.push(statusItem);
      await client.onReady();
    } else {
      await client.onReady();
    }

    // register Notification
    client.onNotification(MessageWithOutput.METHOD, this.showMessage);
    client.onNotification(UpdateBuiltInSchemas.METHOD, this.updateAssociations);
    client.onNotification(CacheSchema.METHOD, this.cacheSchema);
    client.onNotification(
      WatchConfigFile.METHOD,
      this.watchServerTaploConfigFile
    );
    client.onRequest(GetCachedSchema.METHOD, this.getCachedSchema);

    this.watchConfigFile();

    this.client = client;
  }

  get subscriptions(): Disposable[] {
    return this.extCtx.subscriptions;
  }

  // Show message ============================================================
  showMessage(params: MessageWithOutput.Params) {
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

  watchConfigFile() {
    this.taploConfigWatcher?.close();
    this.taploConfigWatcher = undefined;

    const cfgPath: string | undefined = this.config.taploConfig;

    if (typeof cfgPath === 'string' && cfgPath.length > 0) {
      let p = cfgPath;

      if (!isAbsolutePath(p)) {
        const wsPath = workspace.workspaceFolders[0]?.uri;

        if (typeof wsPath !== 'undefined') {
          return;
        }

        p = path.join(wsPath, p);
      }

      this.taploConfigWatcher = fs.watch(p);
      this.taploConfigWatcher.on('change', () => {
        this.client.sendNotification(ConfigFileChanged.METHOD);
      });
    }
  }

  watchServerTaploConfigFile(params: WatchConfigFile.Params) {
    this.serverTaploConfigWatcher?.close();
    this.serverTaploConfigWatcher = undefined;

    const ws = workspace.workspaceFolder.uri;

    if (typeof ws === 'undefined') {
      return;
    }

    this.serverTaploConfigWatcher = fs.watch(params.configPath, () => {
      this.client.sendNotification(ConfigFileChanged.METHOD);
    });
  }

  // cache schema ============================================================
  get schemaPath(): string | undefined {
    return path.join(this.extCtx.storagePath, 'schemas.json');
  }

  private async _schemaData(): Promise<{ [p: string]: string }> {
    let schemas: { [key: string]: string } = {};
    try {
      schemas = JSON.parse(await workspace.readFile(this.schemaPath));
    } catch (e) {
      // Doesn't yet exist.
    }
    return schemas;
  }

  private async cacheSchema(params: CacheSchema.Params) {
    const schemas = await this._schemaData();
    schemas[params.schemaUri] = params.schemaJson;

    const doc: Document = workspace.getDocument(this.schemaPath);
    const _range: vscode_ls.Range = allRange(doc);
    const _edit = vscode_ls.TextEdit.replace(_range, JSON.stringify(schemas));

    await workspace.getDocument(this.schemaPath).applyEdits([_edit]);
  }

  private async getCachedSchema(
    params: GetCachedSchema.Params
  ): Promise<GetCachedSchema.Response> {
    return { schemaJson: (await this._schemaData())[params.schemaUri] };
  }

  // pushCleanup(d: Disposable) {
  //   this.extCtx.subscriptions.push(d);
  // }

  sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  // async sendRequestWithRetry<TParam, TRet>(
  //   reqType: RequestType<TParam, TRet, unknown>,
  //   param: TParam,
  //   token?: CancellationToken
  // ): Promise<TRet> {
  //   for (const delay of [2, 4, 6, 8, 10, null]) {
  //     try {
  //       return await (token
  //         ? this.client.sendRequest(reqType, param, token)
  //         : this.client.sendRequest(reqType, param));
  //     } catch (error) {
  //       if (delay === null) {
  //         throw error;
  //       }
  //
  //       if (error.code === ErrorCodes.RequestCancelled) {
  //         throw error;
  //       }
  //
  //       if (error.code !== ErrorCodes.ContentModified) {
  //         throw error;
  //       }
  //
  //       await this.sleep(10 * (1 << delay));
  //     }
  //   }
  //   throw 'unreachable';
  // }

  private async updateAssociations(params: UpdateBuiltInSchemas.Params) {
    if (this?.config === undefined) {
      console.error('No context!');
      return;
    }
    type Choice = 'ask' | 'always' | 'never';
    const updateNew: Choice = this.config.addNewBuiltins;

    const removeOld: Choice = this.config.removeOldBuiltins;

    if (updateNew === 'never' && removeOld === 'never') {
      return;
    }
    const defaultAssociations: any = this.config.defaultAssociations;
    let currentAssociations: any = this.config.currentAssociations;

    if (deepEqual(defaultAssociations, currentAssociations, { strict: true })) {
      // default values, nothing to do
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
              await this.config.setAssociations(
                {
                  ...currentAssociations,
                  ...toAdd,
                },
                true
              );
              break;
            case 1:
              await this.config.setAddNewBuiltins('never', true);
              break;
            case 2:
              await this.config.setAddNewBuiltins('always', true);
              await this.config.setAssociations(
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
          await this.config.setAssociations(
            {
              ...currentAssociations,
              ...toAdd,
            },
            true
          );
        }
      }
    }

    currentAssociations = this.config.currentAssociations;

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
              await this.config.setAssociations(finalAssociations, true);
              break;
            case 1:
              await this.config.setRemoveOldBuiltins('never', false);
              break;
            case 2:
              await this.config.setRemoveOldBuiltins('always', false);
              await this.config.setAssociations(finalAssociations, true);
              break;
          }
        } else {
          await this.config.setAssociations(finalAssociations, true);
        }
      }
    }
  }
}

function allRange(doc: coc.Document): Range {
  return Range.create(
    Position.create(0, 0),
    Position.create(
      doc.lineCount - 1,
      doc.getline(doc.lineCount - 1).length - 1
    )
  );
}

function registerNotification(
  client,
  method: string,
  handler: GenericNotificationHandler
) {
  client.onNotification(method, handler);
}
