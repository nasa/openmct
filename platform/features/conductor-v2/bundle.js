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

define([
    "./src/TimeConductor",
    "./src/ui/TimeConductorController",
    "./src/ui/MCTConductorAxis",
    "./src/timeSystems/UTCTimeSystem",
    "text!./res/templates/time-conductor.html",
    "text!./res/templates/mode-selector/mode-selector.html",
    "text!./res/templates/mode-selector/mode-menu.html",
    'legacyRegistry'
], function (
    TimeConductor,
    TimeConductorController,
    MCTConductorAxis,
    UTCTimeSystem,
    timeConductorTemplate,
    modeSelectorTemplate,
    modeMenuTemplate,
    legacyRegistry
) {

    legacyRegistry.register("platform/features/conductor-v2", {
        "extensions": {
            "services": [
                {
                    "key": "timeConductor",
                    "implementation": TimeConductor
                }
            ],
            "controllers": [
                {
                    "key": "TimeConductorController",
                    "implementation": TimeConductorController,
                    "depends": [
                        "$scope",
                        "timeConductor",
                        "timeSystems[]"
                    ]
                }
            ],
            "directives": [
                {
                    "key": "mctConductorAxis",
                    "implementation": MCTConductorAxis,
                    "depends": [
                        "timeConductor",
                        "formatService"
                    ]
                }
            ],
            "stylesheets": [
                {
                    "stylesheetUrl": "css/time-conductor.css"
                }
            ],
            "representations": [
                {
                    "key": "time-conductor",
                    "template": timeConductorTemplate
                },
                {
                    "key": "mode-selector",
                    "template": modeSelectorTemplate
                },
                {
                    "key": "mode-menu",
                    "template": modeMenuTemplate
                }
            ],
            "timeSystems": [
                {
                    "implementation": UTCTimeSystem,
                    "depends": ["$timeout"]
                }
            ]
        }
    });
});
