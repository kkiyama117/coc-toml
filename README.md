# coc-toml

<p class="warn"> ***WARNING*** taplo's structure is changed and waiting for its refactoring now, so my implementation is stopping now</p>

toml lsp client extension for coc-nvim
[taplo](https://github.com/tamasfe/taplo) is used to parse toml and [taplo-lsp](https://github.com/kkiyama117/taplo-lsp) is used as language-server

## ! Important

This repo and package is under developing.

There are some bugs, unimplemented features, and documents missing,
though I'm making efforts to add them on it.

Also, issues and pull requests are all welcome. I'm a beginner in rust and ts.
So, tell me if I'm wrong or going to bad way to implement this.

## Install

- from coc command
`:CocInstall coc-toml`
- from plugin manager
  - dein.vim
    ```
    [[plugins]]
    build   = 'yarn install --frozen-lockfile'
    depends = 'coc.nvim'
    merged  = 0
    on_ft   = 'toml'
    repo    = 'kkiyama117/coc-toml'
    rev     = "develop"
    ```

## Keymaps

(WIP, TBD)

## Lists

(WIP, TBD)

## License

MIT

## Using

- [taplo](https://github.com/tamasfe/taplo)
  - to parse toml
  - [taplo-lsp](https://github.com/kkiyama117/taplo-lsp) is forked from [taplo/taplo-ide](https://github.com/tamasfe/taplo/tree/master/taplo-ide)
- [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
  - To generate templates
