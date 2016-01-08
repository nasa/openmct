/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/*global module*/
module.exports = function(config) {
    config.set({

        // Base path that will be used to resolve all file patterns.
        basePath: '',

        // Frameworks to use
        // Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine', 'requirejs'],

        // List of files / patterns to load in the browser.
        // By default, files are also included in a script tag.
        files: [
            {pattern: 'src/**/*.js', included: false},
            {pattern: 'example/**/*.js', included: false},
            {pattern: 'platform/**/*.js', included: false},
            {pattern: 'warp/**/*.js', included: false},
            'test-main.js'
        ],

        // List of files to exclude.
        exclude: [
            'platform/framework/src/Main.js'
        ],

        // Preprocess matching files before serving them to the browser.
        // https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            '**/src/**/!(*Spec).js': [ 'coverage' ]
        },

        // Test results reporter to use
        // Possible values: 'dots', 'progress'
        // Available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'coverage', 'html'],

        // Web server port.
        port: 9876,

        // Wnable / disable colors in the output (reporters and logs).
        colors: true,

        logLevel: config.LOG_INFO,

        // Rerun tests when any file changes.
        autoWatch: true,

        // Specify browsers to run tests in.
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: [
            'Chrome'
        ],

        // Code coverage reporting.
        coverageReporter: {
            dir: "target/coverage"
        },

        // HTML test reporting.
        htmlReporter: {
            outputDir: "target/tests",
            preserveDescribeNesting: true,
            foldAll: false
        },

        // Continuous Integration mode.
        // If true, Karma captures browsers, runs the tests and exits.
        singleRun: true
    });
};
