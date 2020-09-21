import { ServerOptions, TransportKind } from 'coc.nvim';

const getServerOptions = (serverModule): ServerOptions => {
  return {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc },
  };
};

export default getServerOptions;
