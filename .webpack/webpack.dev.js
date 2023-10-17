/* global __dirname module */

/*
This configuration should be used for development purposes. It contains full source map, a
devServer (which be invoked using by `npm start`), and a non-minified Vue.js distribution.
If OpenMCT is to be used for a production server, use webpack.prod.js instead.
*/
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const base = require('./webpack.base');

module.exports = merge(base('development'), {
  devtool: 'inline-source-map',
  mode: 'development',
  watchOptions: {
    // Since we use require.context, webpack is watching the entire directory.
    // We need to exclude any files we don't want webpack to watch.
    // See: https://webpack.js.org/configuration/watch/#watchoptions-exclude
    ignored: [
      '**/{node_modules,dist,docs,e2e}', // All files in node_modules, dist, docs, e2e,
      '**/{*.yml,Procfile,webpack*.js,babel*.js,package*.json,tsconfig.json}', // Config files
      '**/*.{sh,md,png,ttf,woff,svg}', // Non source files
      '**/.*' // dotfiles and dotfolders
    ]
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      __OPENMCT_ROOT_RELATIVE__: '""'
    })
  ],
  devServer: {
    client: {
      progress: true,
      overlay: {
        // Disable overlay for runtime errors.
        // See: https://github.com/webpack/webpack-dev-server/issues/4771
        runtimeErrors: false
      }
    }
  },
  stats: {
    children: true,
    errorDetails: true,
    errorStack: true
  }
});
