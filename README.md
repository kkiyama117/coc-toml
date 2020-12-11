# coc-toml

toml lsp client extension for coc-nvim.

Powered by [taplo](https://github.com/tamasfe/taplo)

## ! Important

- This repo and package is under developing.

- There are some bugs, unimplemented features, and documents missing,
though I'm making efforts to add them on it.

- Issues and pull requests are all welcome. I'm a beginner in rust and ts.
So, please tell me if I'm wrong or going to bad way to implement this.

- Sometimes breaking changes occur because of this plugin is based on mutli
programing language, rust and typescripts. Prease remain I'm trying to make
way to install and run much efficiently under version 0.xx.


## Install

- from coc command
`:CocInstall coc-toml`
- from plugin manager
  - dein.vim
    ```
    [[plugins]]
    repo    = 'kkiyama117/coc-toml'
    depends = 'coc.nvim'
    on_ft   = 'toml'
    ```

## Keymaps
This plugin has no unique keymaps now.
Use your own keybinding or commands for coc.nvim.

## Features
### commands
- `coc-toml.syntaxTree` -> show syntaxTree like `rust-analyzer` does.
- `coc-toml.tomlToJson` -> convert toml to Json. If you run it with visualmode, convert toml in selected range instead of it in the whole of document.
- `coc-toml.reload` -> reload this plugin and taplo instance.

### options
there are many options for this coc-extension.
see `:help coc-toml-options`.
if you need to set these options, edit your `coc-settings.json`(or run `:CocConfig`) and write config like below.

```json
{
  "coc-toml": {
    "debug": true,
    "formatter": {
      "reorderKeys": true
    }
  }
}
```

### Develop

if you want to build from sources or debug this repo, switch to `main` branch and run `yarn --frozen-lockfile` to build.


## License

MIT.

## Using

- [taplo](https://github.com/tamasfe/taplo)
  - to parse toml and some commands
- [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
  - To generate templates
