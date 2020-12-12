import json from '@rollup/plugin-json';
import rust from '@wasm-tool/rollup-plugin-rust';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
// import wasm from 'rollup-plugin-wasm';

export default {
  input: {
    server: 'src/server.ts',
    index: 'src/index.ts',
  },
  output: {
    sourcemap: true,
    format: 'cjs',
    dir: 'lib',
  },
  external: ['commonjs', 'coc.nvim'],
  watch: {
    chokidar: {
      // this options object is passed to chokidar. if you
      // don't have any options, just pass `chokidar: true`
    },
    // include and exclude govern which files to watch. by
    // default, all dependencies will be watched
    // exclude: ['node_modules/**'],
  },
  plugins: [
    json(),
    rust({
      debug: process.env['RELEASE'] !== 'true',
      nodejs: true,
      inlineWasm: process.env['SEPARATE_WASM'] !== 'true',
    }),
    typescript(),
    commonjs({ include: ['src/*.ts', 'node_modules/**'],exclude:["taplo/**/*.ts"] }),
    resolve({ jsnext: true, preferBuiltins: true }),
  ],
};
