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
    "./src/SinewaveTelemetryProvider",
    "./src/SinewaveLimitCapability",
    "./src/SinewaveDeltaFormat",
    'legacyRegistry'
], function (
    SinewaveTelemetryProvider,
    SinewaveLimitCapability,
    SinewaveDeltaFormat,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("example/generator", {
        "name": "Sine Wave Generator",
        "description": "For development use. Generates example streaming telemetry data using a simple sine wave algorithm.",
        "extensions": {
            "components": [
                {
                    "implementation": SinewaveTelemetryProvider,
                    "type": "provider",
                    "provides": "telemetryService",
                    "depends": [
                        "$q",
                        "$timeout"
                    ]
                }
            ],
            "capabilities": [
                {
                    "key": "limit",
                    "implementation": SinewaveLimitCapability
                }
            ],
            "formats": [
                {
                    "key": "example.delta",
                    "implementation": SinewaveDeltaFormat
                }
            ],
            "constants": [
                {
                    "key": "TIME_CONDUCTOR_DOMAINS",
                    "value": [
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
                    "priority": -1
                }
            ],
            "types": [
                {
                    "key": "generator",
                    "name": "Sine Wave Generator",
                    "glyph": "\u0054",
                    "description": "For development use. Generates example streaming telemetry data using a simple sine wave algorithm.",
                    "priority": 10,
                    "features": "creation",
                    "model": {
                        "telemetry": {
                            "period": 10
                        }
                    },
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
                            "cssclass": "l-input-sm l-numeric",
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
