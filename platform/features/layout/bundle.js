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
    "./src/LayoutController",
    "./src/FixedController",
    "./src/LayoutCompositionPolicy",
    'legacyRegistry'
], function (
    LayoutController,
    FixedController,
    LayoutCompositionPolicy,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/features/layout", {
        "name": "Layout components.",
        "description": "Plug in adding Layout capabilities.",
        "extensions": {
            "views": [
                {
                    "key": "layout",
                    "name": "Display Layout",
                    "glyph": "L",
                    "type": "layout",
                    "templateUrl": "templates/layout.html",
                    "editable": true,
                    "uses": []
                },
                {
                    "key": "fixed",
                    "name": "Fixed Position",
                    "glyph": "3",
                    "type": "telemetry.panel",
                    "templateUrl": "templates/fixed.html",
                    "uses": [
                        "composition"
                    ],
                    "gestures": [
                        "drop"
                    ],
                    "toolbar": {
                        "sections": [
                            {
                                "items": [
                                    {
                                        "method": "add",
                                        "glyph": "+",
                                        "control": "menu-button",
                                        "text": "Add",
                                        "options": [
                                            {
                                                "name": "Box",
                                                "glyph": "à",
                                                "key": "fixed.box"
                                            },
                                            {
                                                "name": "Line",
                                                "glyph": "â",
                                                "key": "fixed.line"
                                            },
                                            {
                                                "name": "Text",
                                                "glyph": "ä",
                                                "key": "fixed.text"
                                            },
                                            {
                                                "name": "Image",
                                                "glyph": "ã",
                                                "key": "fixed.image"
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                "items": [
                                    {
                                        "method": "order",
                                        "glyph": "á",
                                        "control": "menu-button",
                                        "options": [
                                            {
                                                "name": "Move to Top",
                                                "glyph": "^",
                                                "key": "top"
                                            },
                                            {
                                                "name": "Move Up",
                                                "glyph": "^",
                                                "key": "up"
                                            },
                                            {
                                                "name": "Move Down",
                                                "glyph": "v",
                                                "key": "down"
                                            },
                                            {
                                                "name": "Move to Bottom",
                                                "glyph": "v",
                                                "key": "bottom"
                                            }
                                        ]
                                    },
                                    {
                                        "property": "fill",
                                        "glyph": "",
                                        "control": "color"
                                    },
                                    {
                                        "property": "stroke",
                                        "glyph": "â",
                                        "control": "color"
                                    },
                                    {
                                        "property": "color",
                                        "glyph": "ä",
                                        "mandatory": true,
                                        "control": "color"
                                    },
                                    {
                                        "property": "url",
                                        "glyph": "ã",
                                        "control": "dialog-button",
                                        "title": "Image Properties",
                                        "dialog": {
                                            "control": "textfield",
                                            "name": "Image URL",
                                            "required": true
                                        }
                                    },
                                    {
                                        "property": "text",
                                        "glyph": "G",
                                        "control": "dialog-button",
                                        "title": "Text Properties",
                                        "dialog": {
                                            "control": "textfield",
                                            "name": "Text",
                                            "required": true
                                        }
                                    },
                                    {
                                        "method": "showTitle",
                                        "glyph": "ç",
                                        "control": "button",
                                        "description": "Show telemetry element title."
                                    },
                                    {
                                        "method": "hideTitle",
                                        "glyph": "å",
                                        "control": "button",
                                        "description": "Hide telemetry element title."
                                    }
                                ]
                            },
                            {
                                "items": [
                                    {
                                        "method": "remove",
                                        "control": "button",
                                        "glyph": "Z"
                                    }
                                ]
                            }
                        ]
                    }
                }
            ],
            "representations": [
                {
                    "key": "frame",
                    "templateUrl": "templates/frame.html"
                }
            ],
            "controllers": [
                {
                    "key": "LayoutController",
                    "implementation": LayoutController,
                    "depends": [
                        "$scope"
                    ]
                },
                {
                    "key": "FixedController",
                    "implementation": FixedController,
                    "depends": [
                        "$scope",
                        "$q",
                        "dialogService",
                        "telemetryHandler",
                        "telemetryFormatter",
                        "throttle"
                    ]
                }
            ],
            "templates": [
                {
                    "key": "fixed.telemetry",
                    "templateUrl": "templates/elements/telemetry.html"
                },
                {
                    "key": "fixed.box",
                    "templateUrl": "templates/elements/box.html"
                },
                {
                    "key": "fixed.line",
                    "templateUrl": "templates/elements/line.html"
                },
                {
                    "key": "fixed.text",
                    "templateUrl": "templates/elements/text.html"
                },
                {
                    "key": "fixed.image",
                    "templateUrl": "templates/elements/image.html"
                }
            ],
            "policies": [
                {
                    "category": "composition",
                    "implementation": LayoutCompositionPolicy
                }
            ],
            "types": [
                {
                    "key": "layout",
                    "name": "Display Layout",
                    "glyph": "L",
                    "description": "A layout in which multiple telemetry panels may be displayed.",
                    "features": "creation",
                    "model": {
                        "composition": []
                    },
                    "properties": [
                        {
                            "name": "Layout Grid",
                            "control": "composite",
                            "pattern": "^(\\d*[1-9]\\d*)?$",
                            "items": [
                                {
                                    "name": "Horizontal grid (px)",
                                    "control": "textfield",
                                    "cssclass": "l-small l-numeric"
                                },
                                {
                                    "name": "Vertical grid (px)",
                                    "control": "textfield",
                                    "cssclass": "l-small l-numeric"
                                }
                            ],
                            "key": "layoutGrid",
                            "conversion": "number[]"
                        }
                    ]
                },
                {
                    "key": "telemetry.panel",
                    "name": "Telemetry Panel",
                    "glyph": "t",
                    "description": "A panel for collecting telemetry elements.",
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
                    "properties": [
                        {
                            "name": "Layout Grid",
                            "control": "composite",
                            "items": [
                                {
                                    "name": "Horizontal grid (px)",
                                    "control": "textfield",
                                    "cssclass": "l-small l-numeric"
                                },
                                {
                                    "name": "Vertical grid (px)",
                                    "control": "textfield",
                                    "cssclass": "l-small l-numeric"
                                }
                            ],
                            "pattern": "^(\\d*[1-9]\\d*)?$",
                            "property": "layoutGrid",
                            "conversion": "number[]"
                        }
                    ]
                }
            ]
        }
    });
});
