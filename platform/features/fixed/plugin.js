/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    "./src/FixedController",
    "./templates/fixed.html",
    "./templates/frame.html",
    "./templates/elements/telemetry.html",
    "./templates/elements/box.html",
    "./templates/elements/line.html",
    "./templates/elements/text.html",
    "./templates/elements/image.html",
    "legacyRegistry"
], function (
    FixedController,
    fixedTemplate,
    frameTemplate,
    telemetryTemplate,
    boxTemplate,
    lineTemplate,
    textTemplate,
    imageTemplate,
    legacyRegistry    
) {
    return function() {
        return function (openmct) {
            openmct.legacyRegistry.register("platform/features/fixed", {
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
                            "uses": ["composition"],
                            "editable": true
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
                    "controllers": [
                        {
                            "key": "FixedController",
                            "implementation": FixedController,
                            "depends": [
                                "$scope",
                                "$q",
                                "dialogService",
                                "openmct",
                                "$element"
                            ]
                        }
                    ],
                    "toolbars": [
                        {
                            name: "Fixed Position Toolbar",
                            key: "fixed.position",
                            description: "Toolbar for the selected element inside a fixed position display.",
                            forSelection: function (selection) {
                                if (!selection) {
                                    return;
                                }
                                
                                return (openmct.editor.isEditing() &&
                                    selection[0] && selection[0].context.elementProxy &&
                                    ((selection[1] && selection[1].context.item.type === 'telemetry.fixed') ||
                                    (selection[0] && selection[0].context.item && selection[0].context.item.type === 'telemetry.fixed')));
                            },
                            toolbar: function (selection) {
                                var imageProperties = ["add", "remove", "order", "stroke", "useGrid", "x", "y", "height", "width", "url"];
                                var boxProperties = ["add", "remove", "order", "stroke", "useGrid", "x", "y", "height", "width", "fill"];
                                var textProperties = ["add", "remove", "order", "stroke", "useGrid", "x", "y", "height", "width", "fill", "color", "size", "text"];
                                var lineProperties = ["add", "remove", "order", "stroke", "useGrid", "x", "y", "x2", "y2"];
                                var telemetryProperties = ["add", "remove", "order", "stroke", "useGrid", "x", "y", "height", "width", "fill", "color", "size", "titled"];
                                var fixedPageProperties = ["add"];

                                var properties = [],
                                    fixedItem = selection[0] && selection[0].context.item,
                                    elementProxy = selection[0] && selection[0].context.elementProxy,
                                    domainObject = selection[1] && selection[1].context.item,
                                    path;

                                if (elementProxy) {
                                    var type = elementProxy.element.type;
                                    path = "configuration['fixed-display'].elements[" + elementProxy.index + "]";
                                    properties =
                                        type === 'fixed.image' ? imageProperties :
                                            type === 'fixed.text' ? textProperties :
                                                type === 'fixed.box' ? boxProperties :
                                                    type === 'fixed.line' ? lineProperties :
                                                        type === 'fixed.telemetry' ? telemetryProperties : [];
                                } else if (fixedItem) {
                                    properties = domainObject && domainObject.type === 'layout' ? [] : fixedPageProperties;
                                }

                                return [
                                    {
                                        control: "menu",
                                        domainObject: domainObject || selection[0].context.item,
                                        method: function (option) {
                                            selection[0].context.fixedController.add(option.key);
                                        },
                                        key: "add",
                                        icon: "icon-plus",
                                        label: "Add",
                                        options: [
                                            {
                                                "name": "Box",
                                                "class": "icon-box",
                                                "key": "fixed.box"
                                            },
                                            {
                                                "name": "Line",
                                                "class": "icon-line-horz",
                                                "key": "fixed.line"
                                            },
                                            {
                                                "name": "Text",
                                                "class": "icon-T",
                                                "key": "fixed.text"
                                            },
                                            {
                                                "name": "Image",
                                                "class": "icon-image",
                                                "key": "fixed.image"
                                            }
                                        ]
                                    },
                                    {
                                        control: "menu",
                                        domainObject: domainObject,
                                        method: function (option) {
                                            console.log('option', option)
                                            selection[0].context.fixedController.order(
                                                selection[0].context.elementProxy,
                                                option.key
                                            );
                                        },
                                        key: "order",
                                        icon: "icon-layers",
                                        title: "Move the selected object above or below other objects",
                                        options: [
                                            {
                                                "name": "Move to Top",
                                                "class": "icon-arrow-double-up",
                                                "key": "top"
                                            },
                                            {
                                                "name": "Move Up",
                                                "class": "icon-arrow-up",
                                                "key": "up"
                                            },
                                            {
                                                "name": "Move Down",
                                                "class": "icon-arrow-down",
                                                "key": "down"
                                            },
                                            {
                                                "name": "Move to Bottom",
                                                "class": "icon-arrow-double-down",
                                                "key": "bottom"
                                            }
                                        ]
                                    },
                                    {
                                        control: "color-picker",
                                        domainObject: domainObject,
                                        property: path + ".fill",
                                        icon: "icon-paint-bucket",
                                        title: "Set fill color",
                                        key: 'fill'
                                    },
                                    {
                                        control: "color-picker",
                                        domainObject: domainObject,
                                        property: path + ".stroke",
                                        icon: "icon-line-horz",
                                        title: "Set border color",
                                        key: 'stroke'
                                    },
                                    {
                                        control: "button",
                                        domainObject: domainObject,
                                        property: path + ".url",
                                        icon: "icon-image",
                                        title: "Edit image properties",
                                        key: 'url',
                                        dialog: {
                                            control: "input",
                                            type: "text",
                                            name: "Image URL",
                                            class: "l-input-lg",
                                            required: true
                                        }
                                    },
                                    {
                                        control: "color-picker",
                                        domainObject: domainObject,
                                        property: path + ".color",
                                        icon: "icon-T",
                                        mandatory: true,
                                        title: "Set text color",
                                        key: 'color'
                                    },
                                    {
                                        control: "select-menu",
                                        domainObject: domainObject,
                                        property: path + ".size",
                                        title: "Set text size",
                                        key: 'size',
                                        options: [9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 30, 36, 48, 72, 96].map(function (size) {
                                            return { "value": size + "px"};
                                        })
                                    },
                                    {
                                        control: "input",
                                        type: "number",
                                        domainObject: domainObject,
                                        property: path + ".x",
                                        label: "X",
                                        title: "X position",
                                        key: "x",
                                        class: "l-input-sm",
                                        min: "0"
                                    },
                                    {
                                        control: "input",
                                        type: "number",
                                        domainObject: domainObject,
                                        property: path + ".y",
                                        label: "Y",
                                        title: "Y position",
                                        key: "y",
                                        class: "l-input-sm",
                                        min: "0"
                                    },
                                    {
                                        control: "input",
                                        type: "number",
                                        domainObject: domainObject,
                                        property: path + ".x",
                                        label: "X1",
                                        title: "X1 position",
                                        key: "x1",
                                        class: "l-input-sm",
                                        min: "0"
                                    },
                                    {
                                        control: "input",
                                        type: "number",
                                        domainObject: domainObject,
                                        property: path + ".y",
                                        label: "Y1",
                                        title: "Y1 position",
                                        key: "y1",
                                        class: "l-input-sm",
                                        min: "0"
                                    },
                                    {
                                        control: "input",
                                        type: "number",
                                        domainObject: domainObject,
                                        property: path + ".x2",
                                        label: "X2",
                                        title: "X2 position",
                                        key: "x2",
                                        class: "l-input-sm",
                                        min: "0"
                                    },
                                    {
                                        control: "input",
                                        type: "number",
                                        domainObject: domainObject,
                                        property: path + ".y2",
                                        label: "Y2",
                                        title: "Y2 position",
                                        key: "y2",
                                        class: "l-input-sm",
                                        min: "0"
                                    },
                                    {
                                        control: "input",
                                        type: "number",
                                        domainObject: domainObject,
                                        property: path + ".height",
                                        label: "H",
                                        title: "Resize object height",
                                        key: "height",
                                        class: "l-input-sm",
                                        min: "1"
                                    },
                                    {
                                        control: "input",
                                        type: "number",
                                        domainObject: domainObject,
                                        property: path + ".width",
                                        label: "W",
                                        title: "Resize object width",
                                        key: "width",
                                        class: "l-input-sm",
                                        min: "1"
                                    },
                                    {
                                        control: "toggle-button",
                                        domainObject: domainObject,
                                        property: path + ".useGrid",
                                        key: "useGrid",
                                        options: [
                                            {
                                                value: true,
                                                icon: 'icon-grid-snap-to',
                                                title: 'Snap to grid'
                                            },
                                            {
                                                value: false,
                                                icon: 'icon-grid-snap-no',
                                                title: "Do not snap to grid"
                                            }
                                        ]
                                    },
                                    {
                                        control: "button",
                                        domainObject: domainObject,
                                        property: path + ".text",
                                        icon: "icon-gear",
                                        title: "Edit text properties",
                                        key: "text",
                                        dialog: {
                                            control: "input",
                                            type: "text",
                                            name: "Text",
                                            required: true
                                        }
                                    },
                                    {
                                        control: "toggle-button",
                                        domainObject: domainObject,
                                        property: path + ".titled",
                                        key: "titled",
                                        options: [
                                            {
                                                value: true,
                                                icon: 'icon-two-parts-both',
                                                title: 'Show label'
                                            },
                                            {
                                                value: false,
                                                icon: 'icon-two-parts-one-only',
                                                title: "Hide label"
                                            }
                                        ]
                                    },
                                    {
                                        control: "button",
                                        domainObject: domainObject,
                                        method: function () {
                                            selection[0].context.fixedController.remove(
                                                selection[0].context.elementProxy
                                            );
                                        },
                                        key: "remove",
                                        icon: "icon-trash"
                                    }
                                ].filter(function (item) {
                                    var filtered;

                                    properties.forEach(function (property) {
                                        if (item.property && item.key === property ||
                                            item.method && item.key === property) {
                                            filtered = item;
                                        }
                                    });

                                    return filtered;
                                });
                            }
                        }
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
            openmct.legacyRegistry.enable("platform/features/fixed");
        }           
    }
});