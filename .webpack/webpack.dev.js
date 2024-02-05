/*
This configuration should be used for development purposes. It contains full source map, a
devServer (which be invoked using by `npm start`), and a non-minified Vue.js distribution.
If OpenMCT is to be used for a production server, use webpack.prod.js instead.
*/
import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import { fileURLToPath } from 'node:url';

import common from './webpack.common.js';

export default merge(common, {
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
    new webpack.DefinePlugin({
      __OPENMCT_ROOT_RELATIVE__: '"dist/"'
    })
  ],
  devtool: 'eval-source-map',
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
      directory: fileURLToPath(new URL('../dist', import.meta.url)),
      publicPath: '/dist',
      watch: false
    }
  }
});
