# coc-toml

![Node.js Package](https://github.com/kkiyama117/coc-toml/workflows/Node.js%20Package/badge.svg)

toml lsp client extension for coc-nvim.

Powered by [taplo](https://github.com/tamasfe/taplo)

## ! Important

- There are some bugs, unimplemented features, and documents missing,
though I'm making efforts to add them on it.

- Issues and pull requests are all welcome. I'm a beginner in rust and ts.
So, please tell me if I'm wrong or going to bad way to implement this.

- This repo and package is under developing. Sometimes breaking changes is made because of this plugin is based on mutli
programing language, rust and typescripts. Please read changelog and doc.

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

### Add external schemas

You can add external schema config for specific type of toml like dein.nvim config file.
To see how to add, see vim help or [doc txt on the web](https://github.com/kkiyama117/coc-toml/blob/main/doc/coc-toml.txt)

## Keymaps
This plugin has no unique keymaps now.
Use your own keybinding or commands for coc.nvim.

## Features
### commands
- `toml.syntaxTree` -> show syntaxTree like `rust-analyzer` does.
- `toml.tomlToJson` -> convert toml to Json. If you run it with visualmode, convert toml in selected range instead of it in the whole of document.
- `toml.reload` -> reload this plugin and taplo instance.

### options
there are many options for this coc-extension.
see `:help coc-toml-options`.
if you need to set these options, edit your `coc-settings.json`(or run `:CocConfig`) and write config like below.

```json
{
  "toml": {
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
