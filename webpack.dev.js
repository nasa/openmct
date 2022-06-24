const { merge } = require('webpack-merge');
const common = require('./webpack.common');

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
        })
    ],
    devtool: 'eval-source-map'
});
