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

define([
    "./src/NewWindowAction",
    "./src/ElectronInitializer",
    'openmct'
], function (
    NewWindowAction,
    ElectronInitializer,
    openmct
) {
    function SyncedNewWindowAction () {
        this.synced = true;
        NewWindowAction.apply(this, arguments)
    }

    SyncedNewWindowAction.prototype = Object.create(NewWindowAction.prototype);

    openmct.legacyRegistry.register("electron", {
        "extensions": {
            "routes": [{
                "when": "/window/:ids*",
                "templateUrl": "templates/browse-window.html",
                "reloadOnSearch": false
            }],
            "runs": [{
                "implementation": ElectronInitializer,
                "depends": ["timeConductor", "$location"]
            }],
            "actions": [
                {
                    "key": "newWindowAction",
                    "name": "Open in Synchronized Window",
                    "implementation": SyncedNewWindowAction,
                    "description": "Open in a new window which follows this time conductor",
                    "depends": [
                        "urlService"
                    ],
                    "category": [
                        "view-control",
                        "contextual"
                    ],
                    "group": "windowing",
                    "cssclass": "icon-new-window",
                    "priority": "preferred"
                },
                {
                    "key": "newWindowUnsynched",
                    "name": "Open in Non-synchronized Window",
                    "implementation": NewWindowAction,
                    "description": "Open in a new window with its own time conductor",
                    "depends": [
                        "urlService"
                    ],
                    "category": [
                        "view-control",
                        "contextual"
                    ],
                    "group": "windowing",
                    "cssclass": "icon-new-window",
                    "priority": "preferred"
                }
            ]
        }
    });
});
