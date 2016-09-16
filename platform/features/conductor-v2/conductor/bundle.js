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
    "./src/ui/TimeConductorViewService",
    "./src/ui/TimeConductorController",
    "./src/TimeConductor",
    "./src/ui/ConductorAxisController",
    "./src/ui/MctConductorAxis",
    "./src/ui/NumberFormat",
    "text!./res/templates/time-conductor.html",
    "text!./res/templates/mode-selector/mode-selector.html",
    "text!./res/templates/mode-selector/mode-menu.html",
    "legacyRegistry"
], function (
    TimeConductorViewService,
    TimeConductorController,
    TimeConductor,
    ConductorAxisController,
    MCTConductorAxis,
    NumberFormat,
    timeConductorTemplate,
    modeSelectorTemplate,
    modeMenuTemplate,
    legacyRegistry
) {

    legacyRegistry.register("platform/features/conductor-v2/conductor", {
        "extensions": {
            "services": [
                {
                    "key": "timeConductor",
                    "implementation": TimeConductor
                },
                {
                    "key": "timeConductorViewService",
                    "implementation": TimeConductorViewService,
                    "depends": [
                        "timeConductor",
                        "timeSystems[]"
                    ]
                }
            ],
            "controllers": [
                {
                    "key": "TimeConductorController",
                    "implementation": TimeConductorController,
                    "depends": [
                        "$scope",
                        "$window",
                        "timeConductor",
                        "timeConductorViewService",
                        "timeSystems[]"
                    ]
                },
                {
                    "key": "ConductorAxisController",
                    "implementation": ConductorAxisController,
                    "depends": [
                        "timeConductor",
                        "formatService"
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
                    "stylesheetUrl": "css/time-conductor-espresso.css",
                    "theme": "espresso"
                },
                {
                    "stylesheetUrl": "css/time-conductor-snow.css",
                    "theme": "snow"
                }
            ],
            "templates": [
                {
                    "key": "conductor",
                    "template": timeConductorTemplate
                },
                {
                    "key": "mode-menu",
                    "template": modeMenuTemplate
                },
                {
                    "key": "mode-selector",
                    "template": modeSelectorTemplate
                }
            ],
            "representations": [
                {
                    "key": "time-conductor",
                    "template": timeConductorTemplate
                }
            ],
            "formats": [
                {
                    "key": "number",
                    "implementation": NumberFormat
                }
            ]
        }
    });
});
