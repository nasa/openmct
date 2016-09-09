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
    "./src/MCTChart",
    "./src/PlotController",
    "./src/policies/PlotViewPolicy",
    "./src/PlotOptionsController",
    "./src/services/ExportImageService",
    "text!./res/templates/plot.html",
    "text!./res/templates/plot-options-browse.html",
    'legacyRegistry'
], function (
    MCTChart,
    PlotController,
    PlotViewPolicy,
    PlotOptionsController,
    exportImageService,
    plotTemplate,
    plotOptionsBrowseTemplate,
    legacyRegistry
) {

    legacyRegistry.register("platform/features/plot", {
        "name": "Plot view for telemetry",
        "extensions": {
            "views": [
                {
                    "name": "Plot",
                    "key": "plot",
                    "cssclass": "icon-sine",
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
                        "$element",
                        "ExportImageService",
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
            "services": [
                {
                    "key": "exportImageService",
                    "implementation": exportImageService,
                    "depends": [
                        "$q",
                        "$timeout",
                        "$log",
                        "EXPORT_IMAGE_TIMEOUT"
                    ]

                }
            ],
            "constants": [
                {
                    "key": "PLOT_FIXED_DURATION",
                    "value": 900000,
                    "priority": "fallback",
                    "comment": "Fifteen minutes."
                },
                {
                    "key": "EXPORT_IMAGE_TIMEOUT",
                    "value": 500,
                    "priority": "fallback"
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
            ],
            "licenses": [
                {
                    "name": "FileSaver.js",
                    "version": "0.0.2",
                    "author": "Eli Grey",
                    "description": "File download initiator (for file exports)",
                    "website": "https://github.com/eligrey/FileSaver.js/",
                    "copyright": "Copyright © 2015 Eli Grey.",
                    "license": "license-mit",
                    "link": "https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md"
                },
                {
                    "name": "html2canvas",
                    "version": "0.4.1",
                    "author": "Niklas von Hertzen",
                    "description": "JavaScript HTML renderer",
                    "website": "https://github.com/niklasvh/html2canvas",
                    "copyright": "Copyright © 2012 Niklas von Hertzen.",
                    "license": "license-mit",
                    "link": "https://github.com/niklasvh/html2canvas/blob/master/LICENSE"
                },
                {
                    "name": "jsPDF",
                    "version": "1.2.61",
                    "author": "James Hall",
                    "description": "JavaScript HTML renderer",
                    "website": "https://github.com/MrRio/jsPDF",
                    "copyright": "Copyright © 2010-2016 James Hall",
                    "license": "license-mit",
                    "link": "https://github.com/MrRio/jsPDF/blob/master/MIT-LICENSE.txt"
                }
            ]
        }
    });
});
