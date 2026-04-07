import { workspace, WorkspaceConfiguration } from 'coc.nvim';

export class Config {
  private readonly rootSection = 'tombi';
  private cfg: WorkspaceConfiguration;

  constructor() {
    workspace.onDidChangeConfiguration(() => this.reload());
    this.cfg = workspace.getConfiguration(this.rootSection);
  }

  private reload() {
    this.cfg = workspace.getConfiguration(this.rootSection);
  }

  get enabled(): boolean {
    return this.cfg.get<boolean>('enabled', true);
  }

  get path(): string | null {
    return this.cfg.get<string | null>('path', null);
  }

  get args(): string[] {
    return this.cfg.get<string[]>('args', []);
  }

  get env(): Record<string, string> {
    return this.cfg.get<Record<string, string>>('env', {});
  }
}

export default new Config();
