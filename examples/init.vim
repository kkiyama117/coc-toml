let s:config_dir = expand('<sfile>:p:h')
execute 'set runtimepath+=' . s:config_dir
execute 'set runtimepath+=' . s:config_dir . '/after'

call plug#begin()

" Test that vim-plug can install plugin
Plug 'tpope/vim-sensible'

" Install coc-toml
let s:local_coc_config = s:config_dir .. "/local_coc.vim"
" exec 'source ' .  s:local_coc_config

" Install coc.nvim 
Plug 'neoclide/coc.nvim', {'branch': 'release'}

call plug#end()
filetype plugin indent on

" Color
hi Normal guibg=NONE ctermbg=NONE
silent! colorscheme seoul256

command! -nargs=0 Format :call CocAction('format')
