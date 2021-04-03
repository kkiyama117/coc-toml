import {
  commands,
  ConfigurationChangeEvent,
  window,
  workspace,
  WorkspaceConfiguration,
} from 'coc.nvim';

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
      window.showMessage('config is changed!');
      window.showMessage(JSON.stringify(this.cfg));
    }

    const requiresReloadOpt = this.requiresReloadOpts.find((opt) =>
      event.affectsConfiguration(opt)
    );
    if (!requiresReloadOpt) return;

    const msg = `Changing "${requiresReloadOpt}" requires a reload`;
    const prompt = await window.showPrompt(`${msg}. Reload now?`);
    if (prompt) {
      await commands.executeCommand(`workbench.action.reloadWindow`);
    }
  }

  private async update(section: string, value: any, isUser?: boolean) {
    this.cfg.update(`${this.rootSection}.${section}`, value, isUser);
  }

  async reset() {
    await this.update('', '', true);
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

  get associations() {
    return this.cfg.get('schema.associations') ?? {};
  }

  get debug() {
    return this.cfg.get('debug');
  }

  async setAssociations(value: any, isUser?: boolean) {
    await this.update('schema.associations', value, isUser);
  }

  get repositoryEnabled() {
    return this.cfg.get('schema.repositoryEnabled') ?? false;
  }

  get indexUrl(): string {
    return this.cfg.get('schema.repositoryUrl') ?? '';
  }

  get ignoreDeprecatedAssociations(): boolean {
    return this.cfg.get('actions.ignoreDeprecatedAssociations');
  }

  async setIgnoreDeprecatedAssociations(value: boolean, isUser?: boolean) {
    await this.cfg.update(
      'actions.ignoreDeprecatedAssociations',
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
