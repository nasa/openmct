var allTestFiles = [];
var TEST_REGEXP = /(Spec)\.js$/;

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        allTestFiles.push(pathToModule(file));
    }
});

// We will be handling es6-promise loading with a shim.
allTestFiles.unshift('es6-promise');

require.config({
    // Karma serves files from the basePath defined in karma.conf.js
    baseUrl: '/base',

    paths: {
        'es6-promise': 'platform/framework/lib/es6-promise-2.0.0.min',
        'moment-duration-format': 'warp/clock/lib/moment-duration-format'
    },
    shim: {
        'es6-promise': {
            init: function () {
                console.log('I was inited!');
                window.Promise = window.Promise || ES6Promise.Promise;
            }
        }
    },

    // dynamically load all test files
    deps: allTestFiles,

    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start
});
