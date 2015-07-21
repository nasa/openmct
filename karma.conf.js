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
            '**/moment*',
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
        preprocessors: {},

        // Test results reporter to use
        // Possible values: 'dots', 'progress'
        // Available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

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

        // Continuous Integration mode.
        // If true, Karma captures browsers, runs the tests and exits.
        singleRun: false
    });
};
