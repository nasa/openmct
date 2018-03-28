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
                    "cssClass": "icon-box-with-dashed-lines",
                    "type": "telemetry.fixed",
                    "template": fixedTemplate,
                    "uses": [
                        "composition"
                    ],
                    "editable": true
                }
            ],
            "toolbars": [
                {
                    name: "Fixed Position Toolbar",
                    key: "fixed.position",
                    description: "A common toolbar for objects inside a fixed position display.",
                    forSelection: function (selection) {
                        return (selection &&
                            selection[0] && selection[0].context.elementProxy &&
                            selection[1] && selection[1].context.item.type === 'telemetry.fixed');
                    },
                    toolbar: function (selection) {
                        var element = "configuration['fixed-display'].elements[" + selection[0].context.elementProxy.index + "]";
                        return [
                            // {
                            //     control: "color",
                            //     domainObject: selection[1].context.item,
                            //     property: element + ".stroke",
                            //     cssClass: "icon-line-horz",
                            //     title: "Border color",
                            //     description: "Set border color",
                            // },
                            {
                                control: "numberfield",
                                domainObject: selection[1].context.item,
                                property: element + ".x",
                                text: "X",
                                name: "X",
                                cssClass: "l-input-sm",
                                min: "0"
                            },
                            {
                                control: "numberfield",
                                domainObject: selection[1].context.item,
                                property: element + ".y",
                                text: "Y",
                                name: "Y",
                                cssClass: "l-input-sm",
                                min: "0"
                            },
                            {
                                control: "numberfield",
                                domainObject: selection[1].context.item,
                                property: element + ".height",                                
                                text: "H",
                                name: "H",
                                cssClass: "l-input-sm",
                                description: "Resize object height",
                                min: "1"
                            },
                            {
                                control: "numberfield",
                                domainObject: selection[1].context.item,
                                property: element + ".width",
                                text: "W",
                                name: "W",
                                cssClass: "l-input-sm",
                                description: "Resize object width",
                                min: "1"
                            },
                            {
                                control: "checkbox",
                                domainObject: selection[1].context.item,
                                property: element + ".useGrid",
                                name: "Snap to Grid"
                            },
                        ];
                    }
                },
                // {
                //     name: "Fixed Line Element Toolbar",
                //     key: "fixed.line",
                //     description: "A toolbar specific to fixed line elements inside a fixed position display.",
                //     forSelection: function (selection) {
                //         return (selection &&
                //             selection[0] && selection[0].context.elementProxy &&
                //             selection[0].context.elementProxy.element.type === 'fixed.line' &&
                //             selection[1] && selection[1].context.item.type === 'telemetry.fixed');
                //     },
                //     toolbar: function (selection) {
                //         var element = "configuration['fixed-display'].elements[" + selection[0].context.elementProxy.index + "]";
                //         return [
                //             {
                //                 control: "numberfield",
                //                 domainObject: selection[1].context.item,
                //                 property: element + ".x2",
                //                 text: "X2",
                //                 name: "X2",
                //                 cssClass: "l-input-sm",
                //                 min: "0"
                //             },
                //             {
                //                 control: "numberfield",
                //                 domainObject: selection[1].context.item,
                //                 property: element + ".y2",
                //                 text: "Y2",
                //                 name: "Y2",
                //                 cssClass: "l-input-sm",
                //                 min: "0"
                //             }
                //         ];
                //     }
                // },
                // {
                //     name: "Fixed Image Element Toolbar",
                //     key: "fixed.image",
                //     description: "A toolbar sepecific to fixed image elements inside a fixed position display.",
                //     forSelection: function (selection) {
                //         return (selection &&
                //             selection[0] && selection[0].context.elementProxy &&
                //             selection[0].context.elementProxy.element.type === 'fixed.image' &&
                //             selection[1] && selection[1].context.item.type === 'telemetry.fixed');
                //     },
                //     toolbar: function (selection) {
                //         var element = "configuration['fixed-display'].elements[" + selection[0].context.elementProxy.index + "]";
                //         return [
                //             {
                //                 control: "dialog-button",
                //                 domainObject: selection[1].context.item,
                //                 property: element + ".url",
                //                 cssClass: "icon-image",
                //                 title: "Image Properties",
                //                 description: "Edit image properties",
                //                 dialog: {
                //                     control: "textfield",
                //                     name: "Image URL",
                //                     cssClass: "l-input-lg",
                //                     required: true
                //                 }
                //             }
                //         ];
                //     }
                // }
            ],
            "types": [
                {
                    "key": "telemetry.fixed",
                    "name": "Fixed Position Display",
                    "cssClass": "icon-box-with-dashed-lines",
                    "description": "Collect and display telemetry elements in " +
                    "alphanumeric format in a simple canvas workspace. " +
                    "Elements can be positioned and sized. " +
                    "Lines, boxes and images can be added as well.",
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
                        "layoutGrid": [64, 16],
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
                    ],
                    "views": [
                        "fixed-display"
                    ]
                }
            ]
        }
    });
});
