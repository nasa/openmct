/* global __dirname module */

/*
This configuration should be used for production installs.
It is the default webpack configuration.
*/
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin');

const common = require('./webpack.common');

const IN_PARALLEL = {
  parallel: true
};

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      __OPENMCT_ROOT_RELATIVE__: '""'
    })
  ],
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [
      new HtmlMinimizerPlugin(IN_PARALLEL),
      new TerserPlugin(IN_PARALLEL),
      new CssMinimizerPlugin(IN_PARALLEL)
    ]
  },
  plugins: [new CompressionPlugin()]
});
