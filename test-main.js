/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

/*global require,window*/
var allTestFiles = [];
var TEST_REGEXP = /(Spec)\.js$/;
var SRC_REGEXP = /^\/base\/(src|platform).*\.js$/;

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file) || SRC_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        allTestFiles.push(pathToModule(file));
    }
});

// Force es6-promise to load.
allTestFiles.unshift('es6-promise');

// Drop legacyRegistry, since it is at a different path by RequireJS config
allTestFiles = allTestFiles.filter(function (file) {
    return file.indexOf('legacyRegistry') === -1;
});

requirejs.config({
    // Karma serves files from the basePath defined in karma.conf.js
    baseUrl: '/base',

    "paths": {
        "legacyRegistry": "src/legacyRegistry",
        "angular": "bower_components/angular/angular.min",
        "angular-route": "bower_components/angular-route/angular-route.min",
        "csv": "bower_components/comma-separated-values/csv.min",
        "es6-promise": "bower_components/es6-promise/es6-promise.min",
        "html2canvas": "bower_components/html2canvas/build/html2canvas.min",
        "jsPDF": "bower_components/jspdf/dist/jspdf.min",
        "moment": "bower_components/moment/moment",
        "moment-duration-format": "bower_components/moment-duration-format/lib/moment-duration-format",
        "saveAs": "bower_components/FileSaver.js/FileSaver.min",
        "screenfull": "bower_components/screenfull/dist/screenfull.min",
        "text": "bower_components/text/text",
        "uuid": "bower_components/node-uuid/uuid",
        "zepto": "bower_components/zepto/zepto.min"
    },

    "shim": {
        "angular": {
            "exports": "angular"
        },
        "angular-route": {
            "deps": [ "angular" ]
        },
        "moment-duration-format": {
            "deps": [ "moment" ]
        },
        "screenfull": {
            "exports": "screenfull"
        },
        "zepto": {
            "exports": "Zepto"
        }
    },

    // dynamically load all test files
    deps: allTestFiles,

    // we have to kickoff jasmine, as it is asynchronous
    callback: function () {
        var args = [].slice.apply(arguments);
        require(['es6-promise'], function (es6Promise) {
            if (!window.Promise) {
                window.Promise = es6Promise.Promise;
            }
            window.__karma__.start.apply(window.__karma__, args);
        });
    }
});
