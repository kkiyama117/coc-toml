import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: {
    server: 'src/server.ts',
    index: 'src/index.ts'
  },
  output: {
    sourcemap: false,
    format: 'cjs',
    dir: 'lib'
  },
  external: ['commonjs', 'coc.nvim'],
  watch: {
    chokidar: {
      exclude: ['node_modules/**']
    }
  },
  plugins: [
    json(),
    typescript(),
    commonjs({ include: ['src/*.ts', 'node_modules/**'] }),
    resolve({ jsnext: true, preferBuiltins: true })
  ]
};
