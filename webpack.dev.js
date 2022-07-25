const { merge } = require('webpack-merge');
const common = require('./webpack.common');

const path = require('path');
const webpack = require('webpack');

module.exports = merge(common, {
    mode: 'development',
    watchOptions: {
        // Since we use require.context, webpack is watching the entire directory.
        // We need to exclude any files we don't want webpack to watch.
        // See: https://webpack.js.org/configuration/watch/#watchoptions-exclude
        ignored: [
            '**/{node_modules,dist,docs,e2e}', // All files in node_modules, dist, docs, e2e,
            '**/{*.yml,Procfile,webpack*.js,babel*.js,package*.json,tsconfig.json,jsdoc.json}', // Config files
            '**/*.{sh,md,png,ttf,woff,svg}', // Non source files
            '**/.*' // dotfiles and dotfolders
        ]
    },
    resolve: {
        alias: {
            "vue": path.join(__dirname, "node_modules/vue/dist/vue.js")
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            __OPENMCT_ROOT_RELATIVE__: '"dist/"'
        })
    ],
    devtool: 'eval-source-map'
});
