let s:config_dir = expand('<sfile>:p:h')
execute 'set runtimepath+=' . s:config_dir
execute 'set runtimepath+=' . s:config_dir . '/after'

call plug#begin()

" List your plugins here
Plug 'tpope/vim-sensible'

" Use release branch (recommended)
Plug 'neoclide/coc.nvim', {'branch': 'release'}

call plug#end()