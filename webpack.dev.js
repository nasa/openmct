const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const path = require('path');
const webpack = require('webpack');

module.exports = merge(common, {
    mode: 'development',
    resolve: {
        alias: {
            "vue": path.join(__dirname, "node_modules/vue/dist/vue.js")
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            __OPENMCT_ROOT_RELATIVE__: '"dist/"'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: './static-root.json',
                    to: '.'
                }
            ]
        })
    ],
    devtool: 'eval-source-map'
});
