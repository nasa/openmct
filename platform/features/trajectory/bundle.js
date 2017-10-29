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

    legacyRegistry.register("platform/features/trajectory", {
        "name": "Trajectory component",
        "description": "Plugin adding Trajectory capabilities.",
        "extensions": {
            "views": [
                {
                    "key": "trajectory",
                    "name": "Trajectory Map",
                    "cssClass": "icon-image",
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
                    "key": "trajectory",
                    "name": "Trajectory Map",
                    "cssClass": "icon-image",
                    "description": "Assemble a 2D or 3D view of a trajectory",
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
                }
            ]
        }
    });
});
