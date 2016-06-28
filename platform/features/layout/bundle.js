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

define([
    "./src/LayoutController",
    "./src/FixedController",
    "./src/LayoutCompositionPolicy",
    "text!./res/templates/layout.html",
    "text!./res/templates/fixed.html",
    "text!./res/templates/frame.html",
    "text!./res/templates/elements/telemetry.html",
    "text!./res/templates/elements/box.html",
    "text!./res/templates/elements/line.html",
    "text!./res/templates/elements/text.html",
    "text!./res/templates/elements/image.html",
    'legacyRegistry'
], function (
    LayoutController,
    FixedController,
    LayoutCompositionPolicy,
    layoutTemplate,
    fixedTemplate,
    frameTemplate,
    telemetryTemplate,
    boxTemplate,
    lineTemplate,
    textTemplate,
    imageTemplate,
    legacyRegistry
) {

    legacyRegistry.register("platform/features/layout", {
        "name": "Layout components.",
        "description": "Plug in adding Layout capabilities.",
        "extensions": {
            "views": [
                {
                    "key": "layout",
                    "name": "Display Layout",
                    "glyph": "\u004c",
                    "cssclass": "icon-layout",
                    "type": "layout",
                    "template": layoutTemplate,
                    "editable": true,
                    "uses": []
                },
                {
                    "key": "fixed",
                    "name": "Fixed Position",
                    "glyph": "3",
                    "cssclass": "icon-telemetry-panel",
                    "type": "telemetry.panel",
                    "template": fixedTemplate,
                    "uses": [
                        "composition"
                    ],
                    "toolbar": {
                        "sections": [
                            {
                                "items": [
                                    {
                                        "method": "add",
                                        "cssclass": "icon-plus",
                                        "control": "menu-button",
                                        "text": "Add",
                                        "options": [
                                            {
                                                "name": "Box",
                                                "cssclass": "icon-box",
                                                "key": "fixed.box"
                                            },
                                            {
                                                "name": "Line",
                                                "cssclass": "icon-line-horz",
                                                "key": "fixed.line"
                                            },
                                            {
                                                "name": "Text",
                                                "cssclass": "icon-T",
                                                "key": "fixed.text"
                                            },
                                            {
                                                "name": "Image",
                                                "cssclass": "icon-image",
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
                                        "cssclass": "icon-layers",
                                        "control": "menu-button",
                                        "options": [
                                            {
                                                "name": "Move to Top",
                                                "cssclass": "icon-arrow-double-up",
                                                "key": "top"
                                            },
                                            {
                                                "name": "Move Up",
                                                "cssclass": "icon-arrow-up",
                                                "key": "up"
                                            },
                                            {
                                                "name": "Move Down",
                                                "cssclass": "icon-arrow-down",
                                                "key": "down"
                                            },
                                            {
                                                "name": "Move to Bottom",
                                                "cssclass": "icon-arrow-double-down",
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
                    "template": frameTemplate
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
                    "template": telemetryTemplate
                },
                {
                    "key": "fixed.box",
                    "template": boxTemplate
                },
                {
                    "key": "fixed.line",
                    "template": lineTemplate
                },
                {
                    "key": "fixed.text",
                    "template": textTemplate
                },
                {
                    "key": "fixed.image",
                    "template": imageTemplate
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
                    "glyph": "\u004c",
                    "cssclass": "icon-layout",
                    "description": "Assemble other objects and components together into a reusable screen layout. Working in a simple canvas workspace, simply drag in the objects you want, position and size them. Save your design and view or edit it at any time.",
                    "priority": 900,
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
                                    "cssclass": "l-input-sm l-numeric"
                                },
                                {
                                    "name": "Vertical grid (px)",
                                    "control": "textfield",
                                    "cssclass": "l-input-sm l-numeric"
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
                    "cssclass": "icon-telemetry-panel",
                    "description": "A panel for collecting telemetry elements.",
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
                    ]
                }
            ]
        }
    });
});
