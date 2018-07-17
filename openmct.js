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
/*global module,BUILD_CONSTANTS*/

const matcher = /\/openmct.js$/;
if (document.currentScript) {
    let src = document.currentScript.src;
    if (src && matcher.test(src)) {
        // eslint-disable-next-line no-undef
        __webpack_public_path__ = src.replace(matcher, '') + '/';
    }
}
const Main = require('./platform/framework/src/Main');
const defaultRegistry = require('./src/defaultRegistry');
const MCT = require('./src/MCT');
const buildInfo = require('./src/plugins/buildInfo/plugin');

var openmct = new MCT();

openmct.legacyRegistry = defaultRegistry;
openmct.install(openmct.plugins.Plot());
openmct.install(openmct.plugins.TelemetryTable());

if (typeof BUILD_CONSTANTS !== 'undefined') {
    openmct.install(buildInfo(BUILD_CONSTANTS));
}

openmct.on('start', function () {
    return new Main().run(defaultRegistry);
});

module.exports = openmct;
