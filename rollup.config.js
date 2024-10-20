import typescript from '@rollup/plugin-typescript';
//import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import replace from '@rollup/plugin-replace';
import path from 'path'; 
import { fileURLToPath } from 'url';

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: 'scripts/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    peerDepsExternal(), 
    resolve(), 
    //commonjs(), 
    typescript({ tsconfig: './tsconfig.json' }),
    replace({
      preventAssignment: true,
      delimiters: ['', ''],
      values: {
        "require('../types/types/foundry/index.d.ts');": '',
        "require('../types/src/global.d.ts');": ''
      }
    })
  ],
  external: (id) => ['jquery', 'node', 'tooltipster'].includes(id) || id.startsWith(path.resolve(__dirname, 'types'))
};
