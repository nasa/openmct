/*
This configuration should be used for development purposes. It contains full source map, a
devServer (which be invoked using by `npm start`), and a non-minified Vue.js distribution.
If OpenMCT is to be used for a production server, use webpack.prod.mjs instead.
*/
import { fileURLToPath } from 'node:url';

import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

import common from './webpack.common.mjs';

export default merge(common, {
  mode: 'development',
  output: {
    // Skip generating verbose path comments in modules — significantly speeds up rebuilds.
    pathinfo: false
  },
  optimization: {
    // Skip work that doesn't matter in dev to make incremental rebuilds faster.
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false
  },
  watchOptions: {
    aggregateTimeout: 300,
    ignored: [
      '**/{node_modules,dist,docs,e2e}',
      '**/{*.yml,Procfile,webpack*.js,babel*.js,package*.json,tsconfig.json}',
      '**/*.{sh,md,png,ttf,woff,svg}',
      '**/.*'
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __OPENMCT_ROOT_RELATIVE__: '"dist/"'
    })
  ],
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    devMiddleware: {
      writeToDisk: (filePathString) => {
        const filePath = path.parse(filePathString);
        const shouldWrite = !filePath.base.includes('hot-update');

        return shouldWrite;
      }
    },
    watchFiles: ['src/**/*.css', 'example/**/*.css'],
    static: [{
      directory: fileURLToPath(new URL('../dist', import.meta.url)),
      publicPath: '/dist',
      watch: false
    }, {
      directory: fileURLToPath(new URL('../e2e/test-data', import.meta.url)),
      publicPath: '/test-data',
      watch: false
    }]
  }
});
