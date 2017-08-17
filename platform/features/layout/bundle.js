/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    "./src/LayoutController",
    "./src/FixedController",
    "./src/LayoutCompositionPolicy",
    './src/MCTTriggerModal',
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
    MCTTriggerModal,
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
                    "cssClass": "icon-layout",
                    "type": "layout",
                    "template": layoutTemplate,
                    "editable": true,
                    "uses": [],
                    "toolbar": {
                        "sections": [
                            {
                                "items": [
                                    {
                                        "method": "showFrame",
                                        "cssClass": "icon-frame-show",
                                        "control": "button",
                                        "title": "Show frame",
                                        "description": "Show frame"
                                    },
                                    {
                                        "method": "hideFrame",
                                        "cssClass": "icon-frame-hide",
                                        "control": "button",
                                        "title": "Hide frame",
                                        "description": "Hide frame"
                                    }
                                ]
                            }
                        ]
                    }
                },
                {
                    "key": "fixed",
                    "name": "Fixed Position",
                    "cssClass": "icon-box-with-dashed-lines",
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
                                        "cssClass": "icon-plus",
                                        "control": "menu-button",
                                        "text": "Add",
                                        "title": "Add",
                                        "description": "Add new items",
                                        "options": [
                                            {
                                                "name": "Box",
                                                "cssClass": "icon-box",
                                                "key": "fixed.box"
                                            },
                                            {
                                                "name": "Line",
                                                "cssClass": "icon-line-horz",
                                                "key": "fixed.line"
                                            },
                                            {
                                                "name": "Text",
                                                "cssClass": "icon-T",
                                                "key": "fixed.text"
                                            },
                                            {
                                                "name": "Image",
                                                "cssClass": "icon-image",
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
                                        "cssClass": "icon-layers",
                                        "control": "menu-button",
                                        "title": "Layering",
                                        "description": "Move the selected object above or below other objects",
                                        "options": [
                                            {
                                                "name": "Move to Top",
                                                "cssClass": "icon-arrow-double-up",
                                                "key": "top"
                                            },
                                            {
                                                "name": "Move Up",
                                                "cssClass": "icon-arrow-up",
                                                "key": "up"
                                            },
                                            {
                                                "name": "Move Down",
                                                "cssClass": "icon-arrow-down",
                                                "key": "down"
                                            },
                                            {
                                                "name": "Move to Bottom",
                                                "cssClass": "icon-arrow-double-down",
                                                "key": "bottom"
                                            }
                                        ]
                                    },
                                    {
                                        "property": "fill",
                                        "cssClass": "icon-paint-bucket",
                                        "title": "Fill color",
                                        "description": "Set fill color",
                                        "control": "color"
                                    },
                                    {
                                        "property": "stroke",
                                        "cssClass": "icon-line-horz",
                                        "title": "Border color",
                                        "description": "Set border color",
                                        "control": "color"
                                    },
                                    {
                                        "property": "color",
                                        "cssClass": "icon-T",
                                        "title": "Text color",
                                        "description": "Set text color",
                                        "mandatory": true,
                                        "control": "color"
                                    },
                                    {
                                        "property": "url",
                                        "cssClass": "icon-image",
                                        "control": "dialog-button",
                                        "title": "Image Properties",
                                        "description": "Edit image properties",
                                        "dialog": {
                                            "control": "textfield",
                                            "name": "Image URL",
                                            "cssClass": "l-input-lg",
                                            "required": true
                                        }
                                    },
                                    {
                                        "property": "text",
                                        "cssClass": "icon-gear",
                                        "control": "dialog-button",
                                        "title": "Text Properties",
                                        "description": "Edit text properties",
                                        "dialog": {
                                            "control": "textfield",
                                            "name": "Text",
                                            "required": true
                                        }
                                    },
                                    {
                                        "method": "showTitle",
                                        "cssClass": "icon-two-parts-both",
                                        "control": "button",
                                        "title": "Show title",
                                        "description": "Show telemetry element title"
                                    },
                                    {
                                        "method": "hideTitle",
                                        "cssClass": "icon-two-parts-one-only",
                                        "control": "button",
                                        "title": "Hide title",
                                        "description": "Hide telemetry element title"
                                    }
                                ]
                            },
                            {
                                "items": [
                                    {
                                        "method": "remove",
                                        "control": "button",
                                        "cssClass": "icon-trash",
                                        "title": "Delete",
                                        "description": "Delete the selected item"
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
            "directives": [
                {
                    "key": "mctTriggerModal",
                    "implementation": MCTTriggerModal,
                    "depends": [
                        "$document"
                    ]
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
                        "openmct"
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
                    "cssClass": "icon-layout",
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
                                    "cssClass": "l-input-sm l-numeric"
                                },
                                {
                                    "name": "Vertical grid (px)",
                                    "control": "textfield",
                                    "cssClass": "l-input-sm l-numeric"
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
                    "cssClass": "icon-telemetry-panel",
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
                                    "cssClass": "l-input-sm l-numeric"
                                },
                                {
                                    "name": "Vertical grid (px)",
                                    "control": "textfield",
                                    "cssClass": "l-input-sm l-numeric"
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
