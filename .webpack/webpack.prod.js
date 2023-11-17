/* global __dirname module */

/*
Production webpack configuration.
*/
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { merge } = require('webpack-merge');

const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const base = require('./webpack.base');

module.exports = merge(base, {
  devtool: 'source-map',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(sc|sa|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: false
            }
          },
          {
            loader: 'resolve-url-loader'
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            // resolve-url-loader needs all loaders below its decl to have sourcemaps enabled
            options: { sourceMap: true }
          }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].css'
    })
  ],
  // TODO (@evenstensberg): splitchunks when application is aligned towards it
  optimization: {
    runtimeChunk: false,
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
