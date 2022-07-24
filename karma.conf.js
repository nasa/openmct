/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

/*global module,process*/

module.exports = (config) => {
    const webpackConfig = require('./webpack.coverage.js');
    delete webpackConfig.output;

    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'indexTest.js',
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
        browsers: [process.env.NODE_ENV === 'debug' ? 'ChromeDebugging' : 'ChromeHeadless'],
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
            outputDir: "dist/reports/tests", //Useful for CircleCI
            outputFile: "test-results.xml", //Useful for CircleCI
            useBrowserName: false //Disable since we only want chrome
        },
        coverageIstanbulReporter: {
            fixWebpackSourcePaths: true,
            dir: "coverage/unit", //Sets coverage file to be consumed by codecov.io
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
            'indexTest.js': ['webpack', 'sourcemap']
        },
        webpack: webpackConfig,
        webpackMiddleware: {
            stats: 'errors-warnings'
        },
        concurrency: 1,
        singleRun: true,
        browserNoActivityTimeout: 400000
    });
};
