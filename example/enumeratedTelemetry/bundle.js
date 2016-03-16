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
    "./src/EnumeratedTelemetryProvider",
    'legacyRegistry'
], function (
    EnumeratedTelemetryProvider,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("example/enumeratedTelemetry", {
        "name": "Enumerated telemetry generator",
        "description": "Example telemetry source that provides enumerated telemetry.",
        "extensions": {
            "components": [
                {
                    "implementation": EnumeratedTelemetryProvider,
                    "type": "provider",
                    "provides": "telemetryService",
                    "depends": [
                        "$q",
                        "$interval"
                    ]
                }
            ],
            "types": [
                {
                    "key": "example.telemetry.enumerated",
                    "name": "Enumerated Telemetry Generator",
                    "glyph": "T",
                    "description": "Generated enumerated telemetry data",
                    "features": "creation",
                    "model": {
                        "telemetry": {

                        }
                    },
                    "telemetry": {
                        "source": "example.telemetry.enumerated",
                        "domains": [
                            {
                                "key": "time",
                                "name": "Time"
                            }
                        ],
                        "ranges": [
                            {
                                "key": "eu",
                                "name": "Engineering Unit"
                            },
                            {
                                "key": "eu",
                                "name": "Enum",
                                "type": "enum",
                                "format": "enum",
                                "enumerations": [
                                    {
                                        "key": "eu",
                                        "format": "enum",
                                        "value": 0,
                                        "string": "OFF"
                                    },
                                    {
                                        "key": "eu",
                                        "format": "enum",
                                        "value": 1,
                                        "string": "IDLE"
                                    },
                                    {
                                        "key": "eu",
                                        "format": "enum",
                                        "value": 2,
                                        "string": "RECEIVE"
                                    },
                                    {
                                        "key": "eu",
                                        "format": "enum",
                                        "value": 3,
                                        "string": "TRANSMIT"
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    });
});
