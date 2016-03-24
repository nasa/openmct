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
    "./src/ImageTelemetryProvider",
    'legacyRegistry'
], function (
    ImageTelemetryProvider,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("example/imagery", {
        "name": "Imagery",
        "description": "Example of a component that produces image telemetry.",
        "extensions": {
            "components": [
                {
                    "implementation": ImageTelemetryProvider,
                    "type": "provider",
                    "provides": "telemetryService",
                    "depends": [
                        "$q",
                        "$timeout"
                    ]
                }
            ],
            "types": [
                {
                    "key": "imagery",
                    "name": "Example Imagery",
                    "glyph": "\u00e3",
                    "features": "creation",
                    "description": "For development use. Creates example imagery data that mimics a live imagery stream.",
                    "priority": 10,
                    "model": {
                        "telemetry": {}
                    },
                    "telemetry": {
                        "source": "imagery",
                        "domains": [
                            {
                                "name": "Time",
                                "key": "time",
                                "format": "utc"
                            }
                        ],
                        "ranges": [
                            {
                                "name": "Image",
                                "key": "url",
                                "format": "imageUrl"
                            }
                        ]
                    }
                }
            ]
        }
    });
});
