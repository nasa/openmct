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
/*global requirejs,BUILD_CONSTANTS*/

requirejs.config({
    "paths": {
        "legacyRegistry": "src/legacyRegistry",
        "angular": "bower_components/angular/angular.min",
        "angular-route": "bower_components/angular-route/angular-route.min",
        "csv": "bower_components/comma-separated-values/csv.min",
        "EventEmitter": "bower_components/eventemitter3/index",
        "es6-promise": "bower_components/es6-promise/es6-promise.min",
        "html2canvas": "bower_components/html2canvas/build/html2canvas.min",
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
        "d3-axis": "node_modules/d3-axis/build/d3-axis.min",
        "d3-array": "node_modules/d3-array/build/d3-array.min",
        "d3-collection": "node_modules/d3-collection/build/d3-collection.min",
        "d3-color": "node_modules/d3-color/build/d3-color.min",
        "d3-format": "node_modules/d3-format/build/d3-format.min",
        "d3-interpolate": "node_modules/d3-interpolate/build/d3-interpolate.min",
        "d3-time": "node_modules/d3-time/build/d3-time.min",
        "d3-time-format": "node_modules/d3-time-format/build/d3-time-format.min",
        "printj": "node_modules/printj/dist/printj.min"
    },
    "shim": {
        "angular": {
            "exports": "angular"
        },
        "angular-route": {
            "deps": ["angular"]
        },
        "EventEmitter": {
            "exports": "EventEmitter"
        },
        "html2canvas": {
            "exports": "html2canvas"
        },
        "moment-duration-format": {
            "deps": ["moment"]
        },
        "saveAs": {
            "exports": "saveAs"
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
        }
    }
});

define([
    './platform/framework/src/Main',
    './src/defaultRegistry',
    './src/MCT',
    './src/plugins/buildInfo/plugin'
], function (Main, defaultRegistry, MCT, buildInfo) {
    var openmct = new MCT();

    openmct.legacyRegistry = defaultRegistry;
    openmct.install(openmct.plugins.Plot());

    if (typeof BUILD_CONSTANTS !== 'undefined') {
        openmct.install(buildInfo(BUILD_CONSTANTS));
    }

    openmct.on('start', function () {
        return new Main().run(defaultRegistry);
    });

    return openmct;
});
