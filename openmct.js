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
/*global requirejs*/

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
        "saveAs": "bower_components/FileSaver.js/FileSaver.min",
        "screenfull": "bower_components/screenfull/dist/screenfull.min",
        "text": "bower_components/text/text",
        "uuid": "bower_components/node-uuid/uuid",
        "zepto": "bower_components/zepto/zepto.min",
        "lodash": "bower_components/lodash/lodash",
        "d3": "bower_components/d3/d3.min"
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
        "EventEmitter": {
            "exports": "EventEmitter"
        },
        "moment-duration-format": {
            "deps": ["moment"]
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
        "d3": {
            "exports": "d3"
        }
    }
});

define([
    './platform/framework/src/Main',
    './src/defaultRegistry',
    './src/MCT'
], function (Main, defaultRegistry, MCT) {
    var openmct = new MCT();

    openmct.legacyRegistry = defaultRegistry;

    openmct.on('start', function () {
        return new Main().run(defaultRegistry);
    });

    return openmct;
});
