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
/*global define*/

define([
    "./src/MCTChart",
    "./src/PlotController",
    "./src/policies/PlotViewPolicy",
    "./src/PlotOptionsController",
    "text!./res/templates/plot.html",
    "text!./res/templates/plot-options-browse.html",
    'legacyRegistry'
], function (
    MCTChart,
    PlotController,
    PlotViewPolicy,
    PlotOptionsController,
    plotTemplate,
    plotOptionsBrowseTemplate,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/features/plot", {
        "name": "Plot view for telemetry",
        "extensions": {
            "views": [
                {
                    "name": "Plot",
                    "key": "plot",
                    "glyph": "6",
                    "template": plotTemplate,
                    "needs": [
                        "telemetry"
                    ],
                    "priority": "preferred",
                    "delegation": true
                }
            ],
            "directives": [
                {
                    "key": "mctChart",
                    "implementation": MCTChart,
                    "depends": [
                        "$interval",
                        "$log"
                    ]
                }
            ],
            "controllers": [
                {
                    "key": "PlotController",
                    "implementation": PlotController,
                    "depends": [
                        "$scope",
                        "telemetryFormatter",
                        "telemetryHandler",
                        "throttle",
                        "PLOT_FIXED_DURATION"
                    ]
                },
                {
                    "key": "PlotOptionsController",
                    "implementation": PlotOptionsController,
                    "depends": [
                        "$scope"
                    ]
                }
            ],
            "constants": [
                {
                    "key": "PLOT_FIXED_DURATION",
                    "value": 900000,
                    "priority": "fallback",
                    "comment": "Fifteen minutes."
                }
            ],
            "policies": [
                {
                    "category": "view",
                    "implementation": PlotViewPolicy
                }
            ],
            "representations": [
                {
                    "key": "plot-options-browse",
                    "template": plotOptionsBrowseTemplate
                }
            ]
        }
    });
});
