import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default {
    input: 'src/SmartValidator.js', 
    output: [
        {
            file: 'dist/smart-validator.min.js',
            format: 'umd', 
            name: 'SmartValidatorLib',
            sourcemap: true,
            plugins: [terser()]
        },
        {
            file: 'dist/smart-validator.esm.js',
            format: 'esm', 
            sourcemap: true
        }
    ],
    plugins: [
        resolve(), 
        babel({
            babelHelpers: 'bundled', 
            exclude: 'node_modules/**', 
            presets: ['@babel/preset-env'] 
        }),
        postcss({ 
            extract: true, 
            minimize: true, 
            plugins: [
                autoprefixer(),
                cssnano()
            ],
        })
    ]
};