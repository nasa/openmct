/* global module */

/*
This file extends the webpack.dev.js config to add babel istanbul coverage.
OpenMCT Continuous Integration servers use this configuration to add code coverage
information to pull requests.
*/

const config = require('./webpack.dev');
// eslint-disable-next-line no-undef
const CI = process.env.CI === 'true';

config.devtool = CI ? false : undefined;

config.devServer.hot = false;

config.module.rules.push({
  test: /\.js$/,
  exclude: /(Spec\.js$)|(node_modules)/,
  use: {
    loader: 'babel-loader',
    options: {
      retainLines: true,
      // eslint-disable-next-line no-undef
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

module.exports = config;
