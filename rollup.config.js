import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/diamiq-sdk.esm.js',
            format: 'esm'
        },
        {
            file: 'dist/diamiq-sdk.cjs.js',
            format: 'cjs'
        },
        {
            name: 'DiamiqClient',
            file: 'dist/diamiq-sdk.min.js',
            format: 'umd',
            plugins: [terser()]
        }
    ],
    plugins: [resolve(), commonjs()]
};