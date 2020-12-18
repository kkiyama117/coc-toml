import {
  commands,
  ConfigurationChangeEvent,
  workspace,
  WorkspaceConfiguration,
} from 'coc.nvim';

type Choice = 'ask' | 'always' | 'never';

export class Config {
  private readonly rootSection = 'toml';
  //TODO: check reload options
  private readonly requiresReloadOpts = [
    'taploConfig',
    'taploServerConfig',
    'taploConfigEnabled',
  ].map((opt) => `${this.rootSection}.${opt}`);
  private cfg: WorkspaceConfiguration;

  constructor() {
    workspace.onDidChangeConfiguration((event) => this.onConfigChange(event));
    this.cfg = workspace.getConfiguration(this.rootSection);
    if (!this.cfg) {
      console.error('cfg is None');
    } else {
      if (this.cfg.get('debug')) {
        console.error(JSON.stringify(this.cfg));
      }
    }
  }

  private async onConfigChange(event: ConfigurationChangeEvent) {
    this.cfg = workspace.getConfiguration(this.rootSection);
    if (this.debug) {
      workspace.showMessage('config is changed!');
      workspace.showMessage(JSON.stringify(this.cfg));
    }

    const requiresReloadOpt = this.requiresReloadOpts.find((opt) =>
      event.affectsConfiguration(opt)
    );
    if (!requiresReloadOpt) return;

    const msg = `Changing "${requiresReloadOpt}" requires a reload`;
    const prompt = await workspace.showPrompt(`${msg}. Reload now?`);
    if (prompt) {
      await commands.executeCommand(`workbench.action.reloadWindow`);
    }
  }

  private async update(section: string, value: any, isUser?: boolean) {
    this.cfg.update(`${this.rootSection}.${section}`, value, isUser);
  }

  get enabled(): boolean {
    return this.cfg.get('enabled');
  }

  get showNotification(): boolean {
    return this.cfg.get('activationStatus');
  }

  get taploConfig(): string | undefined {
    return this.cfg.get('taploConfig');
  }

  get taploServerConfig() {
    return this.cfg.get('taploServerConfig');
  }

  get addNewBuiltins(): Choice {
    return this.cfg.get<string>(
      'extension.actions.schema.addNewBuiltins',
      'ask'
    ) as Choice;
  }

  get removeOldBuiltins() {
    return this.cfg.get<string>(
      'extension.actions.schema.removeOldBuiltins',
      'ask'
    ) as Choice;
  }

  get defaultAssociations() {
    return this.cfg.inspect('schema.associations')?.defaultValue ?? {};
  }

  get currentAssociations() {
    return this.cfg.get('schema.associations') ?? {};
  }

  get debug() {
    return this.cfg.get('debug');
  }

  async setAssociations(value: any, isUser?: boolean) {
    await this.update('schema.associations', value, isUser);
  }

  async setAddNewBuiltins(value: Choice, isUser?: boolean) {
    await this.update('extension.actions.schema.addNewBuiltins', value, isUser);
  }

  async setRemoveOldBuiltins(value: Choice, isUser?: boolean) {
    await this.update(
      'extension.actions.schema.removeOldBuiltins',
      value,
      isUser
    );
  }
  // get inlayHints() {
  //   const hasVirtualText =
  //     workspace.isNvim &&
  //     workspace.nvim.hasFunction('nvim_buf_set_virtual_text');
  //   return {
  //     chainingHints:
  //       hasVirtualText && this.cfg.get<boolean>('inlayHints.chainingHints'),
  //     chainingHintsSeparator: this.cfg.get<string>(
  //       'inlayHints.chainingHintsSeparator'
  //     ),
  //     refreshOnInsertMode:
  //       hasVirtualText &&
  //       this.cfg.get<boolean>('inlayHints.refreshOnInsertMode'),
  //   };
  // }
}

export default new Config();
