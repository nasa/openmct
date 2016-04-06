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
    "./src/ConductorRepresenter",
    "./src/ConductorTelemetryDecorator",
    "./src/ConductorService",
    "text!./res/templates/time-conductor.html",
    'legacyRegistry'
], function (
    ConductorRepresenter,
    ConductorTelemetryDecorator,
    ConductorService,
    timeConductorTemplate,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/features/conductor", {
        "extensions": {
            "representers": [
                {
                    "implementation": ConductorRepresenter,
                    "depends": [
                        "throttle",
                        "conductorService",
                        "$compile",
                        "views[]"
                    ]
                }
            ],
            "components": [
                {
                    "type": "decorator",
                    "provides": "telemetryService",
                    "implementation": ConductorTelemetryDecorator,
                    "depends": [
                        "conductorService"
                    ]
                },
                {
                    "provides": "conductorService",
                    "type": "provider",
                    "implementation": ConductorService,
                    "depends": [
                        "now",
                        "TIME_CONDUCTOR_DOMAINS"
                    ]
                }
            ],
            "templates": [
                {
                    "key": "time-conductor",
                    "template": timeConductorTemplate
                }
            ],
            "constants": [
                {
                    "key": "TIME_CONDUCTOR_DOMAINS",
                    "value": [
                        {
                            "key": "time",
                            "name": "UTC",
                            "format": "utc"
                        }
                    ],
                    "priority": "fallback",
                    "comment": "Placeholder; to be replaced by inspection of available domains."
                }
            ]
        }
    });
});
