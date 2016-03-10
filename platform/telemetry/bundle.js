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
    "./src/TelemetryAggregator",
    "./src/TelemetryController",
    "./src/TelemetryCapability",
    "./src/TelemetryFormatter",
    "./src/TelemetrySubscriber",
    "./src/TelemetryHandler",
    'legacyRegistry'
], function (
    TelemetryAggregator,
    TelemetryController,
    TelemetryCapability,
    TelemetryFormatter,
    TelemetrySubscriber,
    TelemetryHandler,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/telemetry", {
        "name": "Data bundle",
        "description": "Interfaces and infrastructure for real-time and historical data",
        "configuration": {
            "paths": {
                "moment": "moment.min"
            },
            "shim": {
                "moment": {
                    "exports": "moment"
                }
            }
        },
        "extensions": {
            "components": [
                {
                    "provides": "telemetryService",
                    "type": "aggregator",
                    "implementation": TelemetryAggregator,
                    "depends": [
                        "$q"
                    ]
                }
            ],
            "controllers": [
                {
                    "key": "TelemetryController",
                    "implementation": TelemetryController,
                    "depends": [
                        "$scope",
                        "$q",
                        "$timeout",
                        "$log"
                    ]
                }
            ],
            "capabilities": [
                {
                    "key": "telemetry",
                    "implementation": TelemetryCapability,
                    "depends": [
                        "$injector",
                        "$q",
                        "$log"
                    ]
                }
            ],
            "services": [
                {
                    "key": "telemetryFormatter",
                    "implementation": TelemetryFormatter,
                    "depends": [
                        "formatService",
                        "DEFAULT_TIME_FORMAT"
                    ]
                },
                {
                    "key": "telemetrySubscriber",
                    "implementation": TelemetrySubscriber,
                    "depends": [
                        "$q",
                        "$timeout"
                    ]
                },
                {
                    "key": "telemetryHandler",
                    "implementation": TelemetryHandler,
                    "depends": [
                        "$q",
                        "telemetrySubscriber"
                    ]
                }
            ],
            "licenses": [
                {
                    "name": "Moment.js",
                    "version": "2.11.1",
                    "author": "Tim Wood, Iskren Chernev, Moment.js contributors",
                    "description": "Time/date parsing/formatting",
                    "website": "http://momentjs.com",
                    "copyright": "Copyright (c) 2011-2014 Tim Wood, Iskren Chernev, Moment.js contributors",
                    "license": "license-mit",
                    "link": "https://raw.githubusercontent.com/moment/moment/develop/LICENSE"
                }
            ]
        }
    });
});
