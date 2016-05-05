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
    "./src/telemetry/DemoTelemetryProvider",
    "./src/DemoModelProvider",
    "./src/policies/CollectionViewPolicy",
    'text!./res/image-template.html',
    "text!../platform/commonUI/browse/res/templates/items/items.html",
    'legacyRegistry'
], function (
    DemoConductorRepresenter,
    DemoInitializer,
    ConductorServiceDecorator,
    DemoTelemetryProvider,
    DemoModelProvider,
    CollectionViewPolicy,
    ImageTemplate,
    ItemsTemplate,
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
                    "depends": ["$q", "$compile", "conductorService", "views[]", "throttle", "navigationService"]
                }
            ],
            "components": [
                {
                    "implementation": ConductorServiceDecorator,
                    "provides": "conductorService",
                    "type": "decorator"
                },
                {
                    "implementation": DemoTelemetryProvider,
                    "type": "provider",
                    "provides": "telemetryService",
                    "depends": ["$q", "$timeout"]
                },
                {
                    "implementation": DemoModelProvider,
                    "provides": "modelService",
                    "type": "provider",
                    "priority": "fallback"
                },
            ],
            "runs": [
                {
                    "implementation": DemoInitializer,
                    "depends": [
                        "$timeout",
                        "representers[]",
                        "objectService",
                        "$location",
                        "agentService"
                    ]
                }
            ],
            "roots": [
                {
                    "id":"demo:realtime",
                    "model": {
                        "type":"collection",
                        "name": "Real-time Telemetry",
                        "composition": [
                            "be3d5df3-cc6e-4b8b-9865-fcd844e55b94",
                            "930dd0b9-9d98-4908-b19c-c1c887117d42"
                        ]
                    },
                    "priority": "preferred"
                }
            ],
            "types": [
                {
                    "key": "demo-telemetry",
                    "name": "Spacecraft Telemetry Generator",
                    "glyph": "T",
                    "description": "Mock realtime spacecraft telemetry",
                    "model": {
                        "telemetry": {
                            "period": 1000,
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
                                "key": "value",
                                "name": "value"
                            }
                        ]
                    }
                },
                {
                    "key": "image-include",
                    "name": "Image include",
                    "glyph": "ã",
                    "description": "An image include that is resized to fit" +
                    " its container",
                    "views": [
                        "image-view"
                    ],
                    "properties": [
                        {
                            "key": "url",
                            "name": "URL",
                            "control": "textfield",
                            "pattern": "^(ftp|https?)\\:\\/\\/\\w+(\\.\\w+)*(\\:\\d+)?(\\/\\S*)*$",
                            "required": true,
                            "cssclass": "l-input-lg"
                        }
                    ]
                },
                {
                    "key": "demo.plot",
                    "name": "Telemetry Plot",
                    "glyph": "t",
                    "description": "A view that will plot telemetry in a" +
                    " chart.",
                    "priority": 899,
                    "delegates": [
                        "telemetry"
                    ],
                    "views": [
                      "plot"
                    ],
                    "features": "creation",
                    "contains": [
                        {
                            "has": "telemetry"
                        }
                    ],
                    "model": {
                        "composition": []
                    }
                },
                {
                    "name": "Collection",
                    "key": "collection",
                    "glyph": "o",
                    "views": [
                        "collection-view"
                    ],
                    "model": {"composition": []}
                }
            ],
            "licenses": [
                {
                    "name": "Hopscotch",
                    "version": "0.2.5",
                    "author": "linkedin",
                    "description": "Hopscotch is a framework to make it easy" +
                    " for developers to add product tours to their pages.",
                    "license": "license-apache",
                    "website": "http://linkedin.github.io/hopscotch/",
                    "link": "https://raw.githubusercontent.com/linkedin/hopscotch/master/LICENSE"
                }
            ],
            "stylesheets": [
                {
                    "stylesheetUrl": "css/hopscotch.css",
                    priority: "fallback"

                },
                {
                    "stylesheetUrl": "css/tour.css"
                },
                {
                    "stylesheetUrl": "css/image.css"
                }
            ],
            "constants": [
                {
                    "key": "PLOT_FIXED_DURATION",
                    "value": 60000,
                    "comment": "1 minute."
                }
            ],
            "policies": [
                {
                    "category": "view",
                    "implementation": CollectionViewPolicy
                }
            ],
            "views": [
                {
                    "template": ImageTemplate,
                    "name": "ImageInclude",
                    "type": "image-include",
                    "key": "image-view",
                    "editable": false
                },
                {
                    "key": "collection-view",
                    "name": "collection",
                    "glyph": "9",
                    "description": "Grid of available items",
                    "template": ItemsTemplate,
                    "uses": [
                        "composition"
                    ],
                    "editable": false

                }
            ]
        }
    });
});
