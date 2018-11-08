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
        "EventEmitter": "bower_components/eventemitter3/index",
        "es6-promise": "bower_components/es6-promise/es6-promise.min",
        "moment": "bower_components/moment/moment",
        "moment-duration-format": "bower_components/moment-duration-format/lib/moment-duration-format",
        "moment-timezone": "bower_components/moment-timezone/builds/moment-timezone-with-data",
        "saveAs": "bower_components/file-saver/FileSaver.min",
        "screenfull": "bower_components/screenfull/dist/screenfull.min",
        "text": "bower_components/text/text",
        "uuid": "bower_components/node-uuid/uuid",
        "vue": "node_modules/vue/dist/vue.min",
        "zepto": "bower_components/zepto/zepto.min",
        "lodash": "bower_components/lodash/lodash",
        "d3-selection": "node_modules/d3-selection/dist/d3-selection.min",
        "d3-scale": "node_modules/d3-scale/build/d3-scale.min",
        "d3-axis": "node_modules/d3-axis/dist/d3-axis.min",
        "d3-array": "node_modules/d3-array/dist/d3-array.min",
        "d3-collection": "node_modules/d3-collection/dist/d3-collection.min",
        "d3-color": "node_modules/d3-color/build/d3-color.min",
        "d3-format": "node_modules/d3-format/build/d3-format.min",
        "d3-interpolate": "node_modules/d3-interpolate/build/d3-interpolate.min",
        "d3-time": "node_modules/d3-time/dist/d3-time.min",
        "d3-time-format": "node_modules/d3-time-format/dist/d3-time-format.min",
        "html2canvas": "node_modules/html2canvas/dist/html2canvas.min",
        "painterro": "node_modules/painterro/build/painterro.min",
        "printj": "node_modules/printj/dist/printj.min"
    },

    "shim": {
        "angular": {
            "exports": "angular"
        },
        "angular-route": {
            "deps": [ "angular" ]
        },
        "EventEmitter": {
            "exports": "EventEmitter"
        },
        "moment-duration-format": {
            "deps": [ "moment" ]
        },
        "screenfull": {
            "exports": "screenfull"
        },
        "zepto": {
            "exports": "Zepto"
        },
        "lodash": {
            "exports": "lodash"
        },
        "d3-selection": {
            "exports": "d3-selection"
        },
        "d3-scale": {
            "deps": ["d3-array", "d3-collection", "d3-color", "d3-format", "d3-interpolate", "d3-time", "d3-time-format"],
            "exports": "d3-scale"
        },
        "d3-axis": {
            "exports": "d3-axis"
        },
        "dom-to-image": {
            "exports": "domtoimage"
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
