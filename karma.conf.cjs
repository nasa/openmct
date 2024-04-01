/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

// eslint-disable-next-line func-style
const loadWebpackConfig = async () => {
  if (process.env.KARMA_DEBUG) {
    return {
      config: (await import('./.webpack/webpack.dev.mjs')).default,
      browsers: ['ChromeDebugging'],
      singleRun: false
    };
  } else {
    return {
      config: (await import('./.webpack/webpack.coverage.mjs')).default,
      browsers: ['ChromeHeadless'],
      singleRun: true
    };
  }
};

module.exports = async (config) => {
  const { config: webpackConfig, browsers, singleRun } = await loadWebpackConfig();

  // Adjust webpack config for Karma
  delete webpackConfig.output;
  delete webpackConfig.entry; // Karma doesn't support webpack entry

  // Ensure source maps are enabled for better debugging
  webpackConfig.devtool = 'inline-source-map';

  config.set({
    basePath: '',
    frameworks: ['jasmine', 'webpack'],
    files: [
      'index-test.cjs',
      // included means: should the files be included in the browser using <script> tag?
      // We don't want them as a <script> because the shared worker source
      // needs loaded remotely by the shared worker process.
      {
        pattern: 'dist/couchDBChangesFeed.js*',
        included: false
      },
      {
        pattern: 'dist/inMemorySearchWorker.js*',
        included: false
      },
      {
        pattern: 'dist/generatorWorker.js*',
        included: false
      }
    ],
    port: 9876,
    reporters: ['spec', 'junit', 'coverage-istanbul'],
    browsers,
    client: {
      jasmine: {
        random: false,
        timeoutInterval: 5000
      }
    },
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: ['--remote-debugging-port=9222'],
        debug: true
      }
    },
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    junitReporter: {
      outputDir: 'dist/reports/tests', //Useful for CircleCI
      outputFile: 'test-results.xml', //Useful for CircleCI
      useBrowserName: false //Disable since we only want chrome
    },
    coverageIstanbulReporter: {
      fixWebpackSourcePaths: true,
      skipFilesWithNoCoverage: true,
      dir: 'coverage/unit', //Sets coverage file to be consumed by codecov.io
      reports: ['lcovonly']
    },
    specReporter: {
      maxLogLines: 5,
      suppressErrorSummary: false,
      suppressFailed: false,
      suppressPassed: false,
      suppressSkipped: true,
      showSpecTiming: true,
      failFast: false
    },
    preprocessors: {
      'index-test.cjs': ['webpack', 'sourcemap']
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      stats: 'detailed' // Changed to 'detailed' for more debugging info
    },
    concurrency: 1,
    singleRun,
    browserNoActivityTimeout: 400000
  });
};
