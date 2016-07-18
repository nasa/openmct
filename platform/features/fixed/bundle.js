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
    "text!../layout/res/templates/fixed.html",
    'legacyRegistry'
], function (
    fixedTemplate,
    legacyRegistry
) {

    legacyRegistry.register("platform/features/fixed", {
        "name": "Fixed position components.",
        "description": "Plug in adding Fixed Position object type.",
        "extensions": {
            "views": [
                {
                    "key": "fixed-display",
                    "name": "Fixed Position Display",
                    "glyph": "3",
                    "type": "telemetry.fixed",
                    "template": fixedTemplate,
                    "uses": [
                        "composition"
                    ],
                    "editable": true,
                    "toolbar": {
                        "sections": [
                            {
                                "items": [
                                    {
                                        "method": "add",
                                        "glyph": "\u002b",
                                        "control": "menu-button",
                                        "text": "Add",
                                        "options": [
                                            {
                                                "name": "Box",
                                                "glyph": "\u00e0",
                                                "key": "fixed.box"
                                            },
                                            {
                                                "name": "Line",
                                                "glyph": "\u00e2",
                                                "key": "fixed.line"
                                            },
                                            {
                                                "name": "Text",
                                                "glyph": "\u00e4",
                                                "key": "fixed.text"
                                            },
                                            {
                                                "name": "Image",
                                                "glyph": "\u00e3",
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
                                                "glyph": "\u00eb",
                                                "key": "top"
                                            },
                                            {
                                                "name": "Move Up",
                                                "glyph": "\u005e",
                                                "key": "up"
                                            },
                                            {
                                                "name": "Move Down",
                                                "glyph": "\u0076",
                                                "key": "down"
                                            },
                                            {
                                                "name": "Move to Bottom",
                                                "glyph": "\u00ee",
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
            "types": [
                {
                    "key": "telemetry.fixed",
                    "name": "Fixed Position Display",
                    "glyph": "3",
                    "description": "A panel for collecting telemetry" +
                    " elements in a fixed position display.",
                    "priority": 899,
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
                    ],
                    "views": [
                        "fixed-display"
                    ]
                }
            ]
        }
    });
});
