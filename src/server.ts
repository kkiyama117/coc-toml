// Wrapper over the WASM module.
//
// Proxies all messages between the IPC
// channel and the WASM module.
//
// And provides some utilities.

import run from "taplo-lsp";

import * as fs from "fs";

(global as any).sendMessage = (msg: any) => {
    if (process.send) {
        process.send(msg);
    }
};

(global as any).readFile = (path: string): Uint8Array => {
    return fs.readFileSync(path);
};

run();
