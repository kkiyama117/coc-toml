import {
  HandleDiagnosticsSignature,
  LanguageClientOptions,
  ProvideCompletionItemsSignature,
  ProviderResult,
  ResolveCompletionItemSignature,
  workspace,
} from 'coc.nvim';
import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionList,
  Diagnostic,
  Position,
} from 'vscode-languageserver-protocol';

const clientOptions = (config, fileSchemaErrors): LanguageClientOptions => ({
  documentSelector: [
    { scheme: 'file', language: 'toml' },
    { scheme: 'file', language: 'cargoLock' },
  ],
  initializationOptions: {
    configuration: config,
  },

  synchronize: {
    configurationSection: 'coc-toml',
    fileEvents: [
      workspace.createFileSystemWatcher('**/.toml'),
      workspace.createFileSystemWatcher('**/Cargo.lock'),
    ],
  },
  middleware: {
    workspace: {
      // WIP
    },
    handleDiagnostics: (
      uri: string,
      diagnostics: Diagnostic[],
      next: HandleDiagnosticsSignature
    ) => {
      const schemaErrorIndex = diagnostics.findIndex(
        (candidate) => candidate.code === /* SchemaResolveError */ 0x300
      );
      if (uri.endsWith('coc-settings.json')) {
        diagnostics = diagnostics.filter((o) => o.code != 521);
      }
      if (schemaErrorIndex === -1) {
        fileSchemaErrors.delete(uri.toString());
        return next(uri, diagnostics as any);
      }
      const schemaResolveDiagnostic = diagnostics[schemaErrorIndex];
      fileSchemaErrors.set(uri.toString(), schemaResolveDiagnostic.message);
      const doc = workspace.getDocument(uri);
      if (doc && doc.uri == uri) {
        workspace.showMessage(
          `Schema error: ${schemaResolveDiagnostic.message}`,
          'warning'
        );
      }
      next(uri, diagnostics as any);
    },
    resolveCompletionItem: (
      item: CompletionItem,
      token: CancellationToken,
      next: ResolveCompletionItemSignature
    ): ProviderResult<CompletionItem> => {
      return Promise.resolve(next(item, token)).then((item) => {
        // if (item?.data.detail) {
        //   item.detail = item.data.detail;
        // }
        // return item;
        return item;
      });
    },
    provideCompletionItem: (
      document,
      position: Position,
      context: CompletionContext,
      token: CancellationToken,
      next: ProvideCompletionItemsSignature
    ): ProviderResult<CompletionItem[] | CompletionList> => {
      return Promise.resolve(next(document, position, context, token))
        .then
        // WIP
        ();
    },
  },
});

export default clientOptions;
