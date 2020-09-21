import { IWorkspace } from 'coc.nvim';

const cocTomlAutoCmd = (workspace: IWorkspace) => ({
  event: 'InsertLeave',
  request: true,
  callback: () => {
    workspace.showMessage(`registerAutocmd on InsertLeave`);
  },
});
export default cocTomlAutoCmd;
