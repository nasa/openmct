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
var electron = nodeRequire('electron');
define(
    [],
    function () {
        /**
         * The new tab action allows a domain object to be opened
         * into a new browser tab.
         * @memberof platform/commonUI/browse
         * @constructor
         * @implements {Action}
         */
        function ElectronInitializer(conductor) {
            electron.ipcRenderer.on('conductor-bounds', function (event, bounds){
                console.log('conductor changed' + JSON.stringify(bounds));
                var cBounds = conductor.bounds();
                if (bounds.start !== cBounds.start || bounds.end !== cBounds.end) {
                    conductor.bounds(bounds);
                }
            });
            conductor.on('bounds', function (bounds) {
                electron.ipcRenderer.send('conductor-bounds', bounds);
            });
        }

        return ElectronInitializer;
    }
);
