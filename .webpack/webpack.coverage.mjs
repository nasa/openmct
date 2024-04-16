/*
This file extends the webpack.dev.mjs config to add babel istanbul coverage.
OpenMCT Continuous Integration servers use this configuration to add code coverage
information to pull requests.
*/

import config from './webpack.dev.mjs';

config.devtool = 'source-map';
config.devServer.hot = false;

config.module.rules.push({
  test: /\.js$/,
  exclude: /(Spec\.js$)|(node_modules)/,
  use: {
    loader: 'babel-loader',
    options: {
      retainLines: true,
      plugins: [
        [
          'babel-plugin-istanbul',
          {
            extension: ['.js', '.vue']
          }
        ]
      ]
    }
  }
});

export default config;
