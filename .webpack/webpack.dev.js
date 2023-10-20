/* global __dirname module */

/*
This configuration should be used for development purposes. It contains full source map, a
devServer (which be invoked using by `npm start`), and a non-minified Vue.js distribution.
If OpenMCT is to be used for a production server, use webpack.prod.js instead.
*/
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { merge } = require('webpack-merge');

const base = require('./webpack.base');

const projectRootDir = path.resolve(__dirname, '..');

module.exports = merge(base, {
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
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader'
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
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      __OPENMCT_ROOT_RELATIVE__: '""'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].css'
    })
  ],
  devServer: {
    devMiddleware: {
      writeToDisk: (filePathString) => {
        const filePath = path.parse(filePathString);
        const shouldWrite = !filePath.base.includes('hot-update');

        return shouldWrite;
      }
    },
    watchFiles: ['**/*.css'],
    static: {
      directory: path.join(projectRootDir, '/dist'),
      publicPath: '/dist',
      watch: false
    }
  },
  stats: {
    children: true,
    errorDetails: true,
    errorStack: true
  }
});
