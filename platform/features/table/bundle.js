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
    "./src/directives/MCTTable",
    "./src/controllers/RTTelemetryTableController",
    "./src/controllers/TelemetryTableController",
    "./src/controllers/TableOptionsController",
    '../../commonUI/regions/src/Region',
    '../../commonUI/browse/src/InspectorRegion',
    "legacyRegistry"
], function (
    MCTTable,
    RTTelemetryTableController,
    TelemetryTableController,
    TableOptionsController,
    Region,
    InspectorRegion,
    legacyRegistry
) {
    "use strict";
    /**
     * Two region parts are defined here. One that appears only in browse
     * mode, and one that appears only in edit mode. For not they both point
     * to the same representation, but a different key could be used here to
     * include a customized representation for edit mode.
     */
    var tableInspector = new InspectorRegion(),
        tableOptionsEditRegion = new Region({
            name: "table-options",
            title: "Table Options",
            modes: ['edit'],
            content: {
                key: "table-options-edit"
            }
        });
    tableInspector.addRegion(tableOptionsEditRegion);

    legacyRegistry.register("platform/features/table", {
        "extensions": {
            "types": [
                {
                    "key": "table",
                    "name": "Historical Telemetry Table",
                    "glyph": "\ue605",
                    "description": "A table for displaying telemetry data",
                    "features": "creation",
                    "delegates": [
                        "telemetry"
                    ],
                    "inspector": tableInspector,
                    "contains": [
                        {
                            "has": "telemetry"
                        }
                    ],
                    "model": {
                        "composition": []
                    },
                    "views": [
                        "table"
                    ]
                },
                {
                    "key": "rttable",
                    "name": "Real-time Telemetry Table",
                    "glyph": "\ue605",
                    "description": "A table for displaying realtime telemetry" +
                    " data",
                    "features": "creation",
                    "delegates": [
                        "telemetry"
                    ],
                    "inspector": tableInspector,
                    "contains": [
                        {
                            "has": "telemetry"
                        }
                    ],
                    "model": {
                        "composition": []
                    },
                    "views": [
                        "realtime"
                    ]
                }
            ],
            "controllers": [
                {
                    "key": "TelemetryTableController",
                    "implementation": TelemetryTableController,
                    "depends": ["$scope", "telemetryHandler", "telemetryFormatter"]
                },
                {
                    "key": "RTTelemetryTableController",
                    "implementation": RTTelemetryTableController,
                    "depends": ["$scope", "telemetryHandler", "telemetryFormatter"]
                },
                {
                    "key": "TableOptionsController",
                    "implementation": TableOptionsController,
                    "depends": ["$scope"]
                }

            ],
            "views": [
                {
                    "name": "Historical Table",
                    "key": "table",
                    "glyph": "\ue605",
                    "templateUrl": "templates/table.html",
                    "needs": [
                        "telemetry"
                    ],
                    "delegation": true,
                    "editable": true
                },
                {
                    "name": "Real-time Table",
                    "key": "realtime",
                    "glyph": "\ue605",
                    "templateUrl": "templates/rt-table.html",
                    "needs": [
                        "telemetry"
                    ],
                    "delegation": true,
                    "editable": true
                }
            ],
            "directives": [
                {
                    "key": "mctTable",
                    "implementation": MCTTable,
                    "depends": ["$timeout"]
                }
            ],
            "representations": [
                {
                    "key": "table-options-edit",
                    "templateUrl": "templates/table-options-edit.html"
                }
            ]
        }
    });

});
