# coc-toml

![Node.js Package](https://github.com/kkiyama117/coc-toml/workflows/Node.js%20Package/badge.svg)

toml lsp client extension for coc-nvim.

Powered by [taplo](https://github.com/tamasfe/taplo)

## ! Important

- Issues and pull requests are all welcome. I'm a beginner in rust and ts.
So, please tell me if I'm wrong or going to bad way to implement this.

## Install

- from coc command
`:CocInstall coc-toml`
- from plugin manager
  - (e.x) dein.vim
    ```
    [[plugins]]
    repo    = 'kkiyama117/coc-toml'
    depends = 'coc.nvim'
    on_ft   = 'toml'
    ```

### Add external schemas

You can add external schema config for specific type of toml like dein.nvim config file.
To see how to add, see vim help or [doc txt on the web](https://github.com/kkiyama117/coc-toml/blob/main/doc/coc-toml.txt) and [taplo doc](https://taplo.tamasfe.dev/configuration/#schemas).

## Keymaps
This plugin has no unique keymaps now.
Use your own keybinding or commands for coc.nvim.

## Features
### commands
- `toml.syntaxTree` -> show syntaxTree like `rust-analyzer` does.
- `toml.downloadSchemas` -> Download all schemas to local.
- `toml.tomlToJson` -> convert toml to json. If you run it with visualmode, convert toml in selected range instead of it in the whole of document.
- `toml.jsonToToml` -> convert json to toml. If you run it with visualmode, convert json in selected range instead of it in the whole of document.

### options
there are many options for this coc-extension.
see `:help coc-toml-options`.
if you need to set these options, edit your `coc-settings.json`(or run `:CocConfig`).

### Develop

if you want to build from sources or debug this repo, switch to `main` branch and run `yarn --frozen-lockfile` to build.


## License

MIT.

## Using

- [taplo](https://github.com/tamasfe/taplo)
  - to parse toml and some commands
