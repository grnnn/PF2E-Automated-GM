import typescript from '@rollup/plugin-typescript';
//import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import path from 'path'; // Import the path module
import { fileURLToPath } from 'url'; // Import the fileURLToPath function

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: 'scripts/main.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    peerDepsExternal(), 
    resolve(), 
    //commonjs(), 
    typescript({ tsconfig: './tsconfig.json' })
  ],
  external: (id) => ['jquery', 'node', 'tooltipster'].includes(id) || id.startsWith(path.resolve(__dirname, 'types'))
};
