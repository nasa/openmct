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
    "./src/controllers/RealtimeTableController",
    "./src/controllers/HistoricalTableController",
    "./src/controllers/TableOptionsController",
    '../../commonUI/regions/src/Region',
    '../../commonUI/browse/src/InspectorRegion',
    "legacyRegistry"
], function (
    MCTTable,
    RealtimeTableController,
    HistoricalTableController,
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
                    "glyph": "\ue604",
                    "description": "A static table of all values over time for all included telemetry elements. Rows are timestamped data values for each telemetry element; columns are data fields. The number of rows is based on the range of your query. New incoming data must be manually re-queried for.",
                    "priority": 861,
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
                    "glyph": "\ue620",
                    "description": "A scrolling table of latest values for all included telemetry elements. Rows are timestamped data values for each telemetry element; columns are data fields. New incoming data is automatically added to the view.",
                    "priority": 860,
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
                        "rt-table",
                        "scrolling-table"
                    ]
                }
            ],
            "controllers": [
                {
                    "key": "HistoricalTableController",
                    "implementation": HistoricalTableController,
                    "depends": ["$scope", "telemetryHandler", "telemetryFormatter"]
                },
                {
                    "key": "RealtimeTableController",
                    "implementation": RealtimeTableController,
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
                    "glyph": "\ue604",
                    "templateUrl": "templates/historical-table.html",
                    "needs": [
                        "telemetry"
                    ],
                    "delegation": true,
                    "editable": true
                },
                {
                    "name": "Real-time Table",
                    "key": "rt-table",
                    "glyph": "\ue620",
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
            ],
            "stylesheets": [
                {
                    "stylesheetUrl": "css/table.css",
                    "priority": "mandatory"
                }
            ]
        }
    });

});
