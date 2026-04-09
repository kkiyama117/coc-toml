# coc-toml

[![npm version](https://badge.fury.io/js/coc-toml.svg)](https://badge.fury.io/js/coc-toml)

TOML language server extension for [coc.nvim](https://github.com/neoclide/coc.nvim).

Powered by [Tombi](https://github.com/tombi-toml/tombi).

## Breaking Changes in v2.0

v2.0 is a **complete rewrite** with the following breaking changes:

### Language Server: Taplo → Tombi

The underlying language server has been replaced from [Taplo](https://github.com/tamasfe/taplo) to [Tombi](https://github.com/tombi-toml/tombi). Tombi runs as a **native binary** (`tombi lsp`) — WASM is no longer used.

**You must install `tombi` separately** (e.g., `cargo install tombi-cli`, or download from [releases](https://github.com/tombi-toml/tombi/releases)).

### Configuration namespace: `toml.*` → `tombi.*`

All settings have been renamed:

| v1.x (`toml.*`) | v2.0 (`tombi.*`) |
|---|---|
| `toml.enabled` | `tombi.enabled` |
| `toml.activationStatus` | *(removed)* |
| `toml.taploConfig` | *(project-level `tombi.toml` instead)* |
| `toml.taploConfigEnabled` | *(removed)* |
| `toml.semanticTokens` | *(removed — handled by Tombi)* |
| `toml.formatter.*` | *(project-level `tombi.toml` instead)* |
| `toml.schema.*` | *(project-level `tombi.toml` instead)* |
| *(new)* | `tombi.path` |
| *(new)* | `tombi.args` |
| *(new)* | `tombi.env` |

### Commands renamed

| v1.x | v2.0 |
|---|---|
| `toml.syntaxTree` | *(removed)* |
| `toml.downloadSchemas` | `tombi.refreshCache` |
| `toml.tomlToJson` | *(removed)* |
| `toml.jsonToToml` | *(removed)* |
| *(new)* | `tombi.selectSchema` |
| *(new)* | `tombi.showLanguageServerVersion` |
| *(new)* | `tombi.restartLanguageServer` |

### Schema configuration

Schemas are now configured in project-level `tombi.toml` or `.tombi.toml` files, not in `coc-settings.json`. See [Tombi documentation](https://github.com/tombi-toml/tombi) for details.

## Install

### Prerequisites

Install the Tombi binary:

```bash
cargo install tombi-cli
```

Or download from [Tombi releases](https://github.com/tombi-toml/tombi/releases).

### coc.nvim

```vim
:CocInstall coc-toml
```

Or via plugin manager (e.g., dein.vim):

```vim
[[plugins]]
repo    = 'kkiyama117/coc-toml'
depends = 'coc.nvim'
```

## Configuration

Add to your `coc-settings.json` (`:CocConfig`):

```json
{
  "tombi.enabled": true,
  "tombi.path": null,
  "tombi.args": [],
  "tombi.env": {}
}
```

| Setting | Description | Default |
|---|---|---|
| `tombi.enabled` | Enable the extension | `true` |
| `tombi.path` | Absolute path to the tombi executable. If not set, searches PATH. | `null` |
| `tombi.args` | Additional arguments passed to `tombi lsp` | `[]` |
| `tombi.env` | Environment variables passed to the tombi process | `{}` |

Formatter, linter, and schema settings are configured in project-level `tombi.toml` files, not in `coc-settings.json`.

## Commands

| Command | Description |
|---|---|
| `tombi.refreshCache` | Refresh schema cache |
| `tombi.selectSchema` | Select schema for current file |
| `tombi.showLanguageServerVersion` | Show Tombi version |
| `tombi.restartLanguageServer` | Restart the language server |

## Features

- Formatting and linting for TOML files
- Completion with schema validation
- Go-to-definition and hover
- Diagnostics
- Schema association

## Develop

```bash
pnpm install --frozen-lockfile
pnpm build
```

## License

MIT.

## Dependencies

- [Tombi](https://github.com/tombi-toml/tombi) — TOML language server
- [coc.nvim](https://github.com/neoclide/coc.nvim)
