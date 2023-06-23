/* global __dirname module */

/*
This configuration should be used for production installs.
It is the default webpack configuration.
*/
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const common = require('./webpack.common');
const projectRootDir = path.resolve(__dirname, '..');

module.exports = merge(common, {
  mode: 'production',
  resolve: {
    alias: {
      vue: path.join(projectRootDir, 'node_modules/vue/dist/vue.min.js')
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      __OPENMCT_ROOT_RELATIVE__: '""'
    })
  ],
  devtool: 'source-map'
});
