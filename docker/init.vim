" Minimal init.vim for coc-toml smoke testing.
"
" coc.nvim is loaded via Vim's native package path
" (~/.local/share/nvim/site/pack/coc/start/coc.nvim) so no plugin manager
" is required.

set nocompatible
filetype plugin indent on
syntax on

set hidden
set updatetime=300
set shortmess+=c
set signcolumn=yes

" Tell coc where to find its settings file.
let g:coc_config_home = expand('~/.config/nvim')

" Detect TOML for the sample files.
autocmd BufRead,BufNewFile *.toml set filetype=toml
