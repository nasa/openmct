/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

    const webpackConfig = require('./webpack.config.js');
    delete webpackConfig.output;
    // delete webpackConfig.entry;
    // delete webpackConfig.stats;

    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'platform/**/*Spec.js',
            'src/**/*Spec.js'
        ],
        // exclude: [
        //     '**/*.json'
        // ],
        port: 9876,
        reporters: [
            'progress',
            // 'coverage',
            // 'html'
        ],
        browsers: ['ChromeHeadless'],
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,

        // coverageReporter: {
        //     dir: process.env.CIRCLE_ARTIFACTS ?
        //         process.env.CIRCLE_ARTIFACTS + '/coverage' :
        //         "dist/reports/coverage",
        //     check: {
        //         global: {
        //             lines: 80,
        //             excludes: ['src/plugins/plot/**/*.js']
        //         }
        //     }
        // },

        // HTML test reporting.
        // htmlReporter: {
        //     outputDir: "dist/reports/tests",
        //     preserveDescribeNesting: true,
        //     foldAll: false
        // },


        preprocessors: {
            // add webpack as preprocessor
            'platform/**/*Spec.js': [ 'webpack' ],
            'src/**/*Spec.js': [ 'webpack' ]
        },

        webpack: webpackConfig,

        webpackMiddleware: {
            stats: 'errors-only',
            logLevel: 'warn'
        },
        singleRun: true
    });
}

        // // List of files to exclude.
        // exclude: [
        //     'platform/framework/src/Main.js'
        // ],
//
//         // Preprocess matching files before serving them to the browser.
//         // https://npmjs.org/browse/keyword/karma-preprocessor
//         preprocessors: {
//             'src/**/!(*Spec).js': [ 'coverage' ],
//             'platform/**/src/**/!(*Spec).js': [ 'coverage' ]
//         },
//
//         // Test results reporter to use
//         // Possible values: 'dots', 'progress'
//         // Available reporters: https://npmjs.org/browse/keyword/karma-reporter
//         reporters: ['progress', 'coverage', 'html'],
//
//         // Web server port.
//         port: 9876,
//
//         // Wnable / disable colors in the output (reporters and logs).
//         colors: true,
//
//         logLevel: config.LOG_INFO,
//
//         // Rerun tests when any file changes.
//         autoWatch: true,
//
//         // Specify browsers to run tests in.
//         // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
//         browsers: [
//             'ChromeHeadless'
//         ],
//
//         // Code coverage reporting.
//
//         // Continuous Integration mode.
//         // If true, Karma captures browsers, runs the tests and exits.
//         singleRun: true
//     });
// };
