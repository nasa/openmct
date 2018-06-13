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
                    "uses": [],
                    "editable": true
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

                        return (
                            selection[0] && selection[0].context.elementProxy &&
                            selection[1] && selection[1].context.item.type === 'telemetry.fixed' ||
                            selection[0] && selection[0].context.item.type === 'telemetry.fixed'
                        );
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
                                control: "menu-button",
                                domainObject: domainObject || selection[0].context.item,
                                method: function (value) {
                                    selection[0].context.fixedController.add(value);
                                },
                                key: "add",
                                cssClass: "icon-plus",
                                text: "Add",
                                options: [
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
                            },
                            {
                                control: "menu-button",
                                domainObject: domainObject,
                                method: function (value) {
                                    selection[0].context.fixedController.order(
                                        selection[0].context.elementProxy,
                                        value
                                    );
                                },
                                key: "order",
                                cssClass: "icon-layers",
                                title: "Layering",
                                description: "Move the selected object above or below other objects",
                                options: [
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
                                control: "color",
                                domainObject: domainObject,
                                property: path + ".fill",
                                cssClass: "icon-paint-bucket",
                                title: "Fill color",
                                description: "Set fill color",
                                key: 'fill'
                            },
                            {
                                control: "color",
                                domainObject: domainObject,
                                property: path + ".stroke",
                                cssClass: "icon-line-horz",
                                title: "Border color",
                                description: "Set border color",
                                key: 'stroke'
                            },
                            {
                                control: "dialog-button",
                                domainObject: domainObject,
                                property: path + ".url",
                                cssClass: "icon-image",
                                title: "Image Properties",
                                description: "Edit image properties",
                                key: 'url',
                                dialog: {
                                    control: "textfield",
                                    name: "Image URL",
                                    cssClass: "l-input-lg",
                                    required: true
                                }
                            },
                            {
                                control: "color",
                                domainObject: domainObject,
                                property: path + ".color",
                                cssClass: "icon-T",
                                title: "Text color",
                                mandatory: true,
                                description: "Set text color",
                                key: 'color'
                            },
                            {
                                control: "select",
                                domainObject: domainObject,
                                property: path + ".size",
                                title: "Text size",
                                description: "Set text size",
                                "options": [9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 30, 36, 48, 72, 96].map(function (size) {
                                    return { "name": size + " px", "value": size + "px" };
                                }),
                                key: 'size'
                            },
                            {
                                control: "numberfield",
                                domainObject: domainObject,
                                property: path + ".x",
                                text: "X",
                                name: "X",
                                key: "x",
                                cssClass: "l-input-sm",
                                min: "0"
                            },
                            {
                                control: "numberfield",
                                domainObject: domainObject,
                                property: path + ".y",
                                text: "Y",
                                name: "Y",
                                key: "y",
                                cssClass: "l-input-sm",
                                min: "0"
                            },
                            {
                                control: "numberfield",
                                domainObject: domainObject,
                                property: path + ".x",
                                text: "X1",
                                name: "X1",
                                key: "x1",
                                cssClass: "l-input-sm",
                                min: "0"
                            },
                            {
                                control: "numberfield",
                                domainObject: domainObject,
                                property: path + ".y",
                                text: "Y1",
                                name: "Y1",
                                key: "y1",
                                cssClass: "l-input-sm",
                                min: "0"
                            },
                            {
                                control: "numberfield",
                                domainObject: domainObject,
                                property: path + ".x2",
                                text: "X2",
                                name: "X2",
                                key: "x2",
                                cssClass: "l-input-sm",
                                min: "0"
                            },
                            {
                                control: "numberfield",
                                domainObject: domainObject,
                                property: path + ".y2",
                                text: "Y2",
                                name: "Y2",
                                key: "y2",
                                cssClass: "l-input-sm",
                                min: "0"
                            },
                            {
                                control: "numberfield",
                                domainObject: domainObject,
                                property: path + ".height",
                                text: "H",
                                name: "H",
                                key: "height",
                                cssClass: "l-input-sm",
                                description: "Resize object height",
                                min: "1"
                            },
                            {
                                control: "numberfield",
                                domainObject: domainObject,
                                property: path + ".width",
                                text: "W",
                                name: "W",
                                key: "width",
                                cssClass: "l-input-sm",
                                description: "Resize object width",
                                min: "1"
                            },
                            {
                                control: "checkbox",
                                domainObject: domainObject,
                                property: path + ".useGrid",
                                name: "Snap to Grid",
                                key: "useGrid"
                            },
                            {
                                control: "dialog-button",
                                domainObject: domainObject,
                                property: path + ".text",
                                cssClass: "icon-gear",
                                title: "Text Properties",
                                description: "Edit text properties",
                                key: "text",
                                dialog: {
                                    control: "textfield",
                                    name: "Text",
                                    required: true
                                }
                            },
                            {
                                control: "checkbox",
                                domainObject: domainObject,
                                property: path + ".titled",
                                name: "Show Title",
                                key: "titled"
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
                                cssClass: "icon-trash"
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
});
