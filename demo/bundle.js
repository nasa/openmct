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
    "./src/conductor/DemoConductorRepresenter",
    "./src/DemoInitializer",
    "./src/conductor/ConductorServiceDecorator",
    "./src/conductor/DemoTelemetryDecorator",
    "./src/telemetry/DemoTelemetryProvider",
    'legacyRegistry'
], function (
    DemoConductorRepresenter,
    DemoInitializer,
    ConductorServiceDecorator,
    DemoTelemetryDecorator,
    DemoTelemetryProvider,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("demo", {
        "name": "Live Demo configuration",
        "description": "Adds demo data types, and demo-specific behavior",
        "extensions": {
            "representers": [
                {
                    "implementation": DemoConductorRepresenter,
                    "depends": ["$q", "$compile", "conductorService", "views[]", "throttle"]
                }
            ],
            "components": [
                {
                    "implementation": ConductorServiceDecorator,
                    "provides": "conductorService",
                    "type": "decorator"
                },
                {
                    "implementation": DemoTelemetryDecorator,
                    "provides": "telemetryService",
                    "type": "decorator",
                    "priority": "mandatory"
                },
                {
                    "implementation": DemoTelemetryProvider,
                    "type": "provider",
                    "provides": "telemetryService",
                    "depends": ["$q", "$timeout"]
                }
            ],
            "runs": [
                {
                    "implementation": DemoInitializer,
                    "depends": [
                        "representers[]"
                    ]
                }
            ],
            "types": [
                {
                    "key": "demo-telemetry",
                    "name": "Spacecraft Telemetry Generator",
                    "glyph": "T",
                    "description": "Mock realtime spacecraft telemetry",
                    "features": "creation",
                    "model": {
                        "telemetry": {
                            "period": 10000,
                            "multiplier": 10
                        }
                    },
                    "telemetry": {
                        "source": "demo-telemetry",
                        "domains": [
                            {
                                "key": "time",
                                "name": "Time"
                            }
                        ],
                        "ranges": [
                            {
                                "key": "sin",
                                "name": "value"
                            }
                        ]
                    }
                }
            ]
        }
    });
});
