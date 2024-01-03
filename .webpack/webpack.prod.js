/*
This configuration should be used for production installs.
It is the default webpack configuration.
*/

import webpack from 'webpack';
import { merge } from 'webpack-merge';

import common from './webpack.common.js';

export default merge(common, {
  mode: 'production',
  plugins: [
    new webpack.DefinePlugin({
      __OPENMCT_ROOT_RELATIVE__: '""'
    })
  ],
  devtool: 'source-map'
});
