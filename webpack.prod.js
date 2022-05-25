const { merge } = require('webpack-merge');
const common = require('./webpack.common');

const path = require('path');
const webpack = require('webpack');

module.exports = merge(common, {
    mode: 'production',
    resolve: {
        alias: {
            "vue": path.join(__dirname, "node_modules/vue/dist/vue.min.js")
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            __OPENMCT_ROOT_RELATIVE__: '""'
        })
    ],
    devtool: 'eval-source-map'
});
