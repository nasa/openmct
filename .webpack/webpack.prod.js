/* global __dirname module */

/*
This configuration should be used for production installs.
It is the default webpack configuration.
*/
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const base = require('./webpack.base');

module.exports = merge(base('production'), {
  devtool: false,
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      __OPENMCT_ROOT_RELATIVE__: '""',
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ],
  optimization: {
    runtimeChunk: false,
    splitChunks: {
      cacheGroups: {
        default: false,
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
          minChunks: 2
        }
      }
    },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false
          },
          compress: {
            passes: 3,
            pure_getters: true,
            unsafe: true
          },
          ecma: undefined,
          warnings: false,
          parse: {
            html5_comments: false
          },
          mangle: true,
          module: false,
          toplevel: false,
          nameCache: null,
          ie8: false,
          keep_classnames: false,
          keep_fnames: false,
          safari10: false
        }
      }),
      new CssMinimizerPlugin()
    ]
  },
  stats: {
    children: true,
    errorDetails: true
  }
});
