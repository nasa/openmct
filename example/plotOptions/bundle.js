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
    'legacyRegistry',
    '../../platform/commonUI/browse/src/InspectorRegion',
    '../../platform/commonUI/regions/src/Region'
], function (
    legacyRegistry,
    InspectorRegion,
    Region
) {
    "use strict";

    /**
     * Add a 'plot options' region part to the inspector region for the
     * Telemetry Plot type only. {@link InspectorRegion} is a default region
     * implementation that is added automatically to all types. In order to
     * customize what appears in the inspector region, you can start from a
     * blank slate by using Region, or customize the default inspector
     * region by using {@link InspectorRegion}.
     */
    var plotInspector = new InspectorRegion(),
     /**
      * Two region parts are defined here. One that appears only in browse
      * mode, and one that appears only in edit mode. For not they both point
      * to the same representation, but a different key could be used here to
      * include a customized representation for edit mode.
      */
        plotOptionsBrowseRegion = new Region({
            name: "plot-options",
            title: "Plot Options",
            modes: ['browse'],
            content: {
                key: "plot-options-browse"
            }
        }),
        plotOptionsEditRegion = new Region({
            name: "plot-options",
            title: "Plot Options",
            modes: ['edit'],
            content: {
                key: "plot-options-browse"
            }
        });

    /**
     * Both parts are added, and policies of type 'region' will determine
     * which is shown based on domain object state. A default policy is
     * provided which will check the 'modes' attribute of the region part
     * definition.
     */
    plotInspector.addRegion(plotOptionsBrowseRegion);
    plotInspector.addRegion(plotOptionsEditRegion);

    legacyRegistry.register("example/plotType", {
        "name": "Plot Type",
        "description": "Example illustrating registration of a new object type",
        "extensions": {
            "types": [
                {
                    "key": "plot",
                    "name": "Example Telemetry Plot",
                    "glyph": "\u0074",
                    "description": "For development use. A plot for displaying telemetry.",
                    "priority": 10,
                    "delegates": [
                        "telemetry"
                    ],
                    "features": "creation",
                    "contains": [
                        {
                            "has": "telemetry"
                        }
                    ],
                    "model": {
                        "composition": []
                    },
                    "inspector": plotInspector,
                    "telemetry": {
                        "source": "generator",
                        "domains": [
                            {
                                "key": "time",
                                "name": "Time"
                            },
                            {
                                "key": "yesterday",
                                "name": "Yesterday"
                            },
                            {
                                "key": "delta",
                                "name": "Delta",
                                "format": "example.delta"
                            }
                        ],
                        "ranges": [
                            {
                                "key": "sin",
                                "name": "Sine"
                            },
                            {
                                "key": "cos",
                                "name": "Cosine"
                            }
                        ]
                    },
                    "properties": [
                        {
                            "name": "Period",
                            "control": "textfield",
                            "cssclass": "l-small l-numeric",
                            "key": "period",
                            "required": true,
                            "property": [
                                "telemetry",
                                "period"
                            ],
                            "pattern": "^\\d*(\\.\\d*)?$"
                        }
                    ]
                }
            ]
        }
    });
});
