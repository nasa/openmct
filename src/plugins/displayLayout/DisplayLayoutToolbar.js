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

define([], function () {

    function DisplayLayoutToolbar(openmct) {
        return {
            name: "Display Layout Toolbar",
            key: "layout",
            description: "A toolbar for objects inside a display layout.",
            forSelection: function (selection) {
                // Apply the layout toolbar if the selected object
                // is inside a layout, or the main layout is selected.
                return (selection &&
                    ((selection[1] && selection[1].context.item && selection[1].context.item.type === 'layout') ||
                        (selection[0].context.item && selection[0].context.item.type === 'layout')));
            },
            toolbar: function (selection) {
                const DIALOG_FORM = {
                    'text': {
                        name: "Text Element Properties",
                        sections: [
                            {
                                rows: [
                                    {
                                        key: "text",
                                        control: "textfield",
                                        name: "Text",
                                        required: true
                                    }
                                ]
                            }
                        ]
                    },
                    'image': {
                        name: "Image Properties",
                        sections: [
                            {
                                rows: [
                                    {
                                        key: "url",
                                        control: "textfield",
                                        name: "Image URL",
                                        "cssClass": "l-input-lg",
                                        required: true
                                    }
                                ]
                            }
                        ]
                    }
                };

                function getUserInput(form) {
                    return openmct.$injector.get('dialogService').getUserInput(form, {});
                }

                function getPath() {
                    return `configuration.items[${selection[0].context.index}]`;
                }

                let selectedParent = selection[1] && selection[1].context.item,
                    selectedObject = selection[0].context.item,
                    layoutItem = selection[0].context.layoutItem,
                    toolbar = [];

                if (selectedObject && selectedObject.type === 'layout') {
                    toolbar.push({
                        control: "menu",
                        domainObject: selectedObject,
                        method: function (option) {
                            let name = option.name.toLowerCase();
                            let form = DIALOG_FORM[name];
                            if (form) {
                                getUserInput(form)
                                    .then(element => selection[0].context.addElement(name, element));
                            } else {
                                selection[0].context.addElement(name);
                            }
                        },
                        key: "add",
                        icon: "icon-plus",
                        label: "Add",
                        options: [
                            {
                                "name": "Box",
                                "class": "icon-box-round-corners"
                            },
                            {
                                "name": "Line",
                                "class": "icon-line-horz"
                            },
                            {
                                "name": "Text",
                                "class": "icon-font"
                            },
                            {
                                "name": "Image",
                                "class": "icon-image"
                            }
                        ]
                    });
                }

                if (!layoutItem) {
                    return toolbar;
                }

                let separator = {
                    control: "separator"
                };
                let remove = {
                    control: "button",
                    domainObject: selectedParent,
                    icon: "icon-trash",
                    title: "Delete the selected object",
                    method: function () {
                        let removeItem = selection[1].context.removeItem;
                        let prompt = openmct.overlays.dialog({
                            iconClass: 'alert',
                            message: `Warning! This action will remove this item from the Display Layout. Do you want to continue?`,
                            buttons: [
                                {
                                    label: 'Ok',
                                    emphasis: 'true',
                                    callback: function () {
                                        removeItem(layoutItem, selection[0].context.index);
                                        prompt.dismiss();
                                    }
                                },
                                {
                                    label: 'Cancel',
                                    callback: function () {
                                        prompt.dismiss();
                                    }
                                }
                            ]
                        });
                    }
                };
                let stackOrder = {
                    control: "menu",
                    domainObject: selectedParent,
                    icon: "icon-layers",
                    title: "Move the selected object above or below other objects",
                    options: [
                        {
                            name: "Move to Top",
                            value: "top",
                            class: "icon-arrow-double-up"
                        },
                        {
                            name: "Move Up",
                            value: "up",
                            class: "icon-arrow-up"
                        },
                        {
                            name: "Move Down",
                            value: "down",
                            class: "icon-arrow-down"
                        },
                        {
                            name: "Move to Bottom",
                            value: "bottom",
                            class: "icon-arrow-double-down"
                        }
                    ],
                    method: function (option) {
                        selection[1].context.orderItem(option.value, selection[0].context.index);
                    }
                };
                let useGrid = {
                    control: "toggle-button",
                    domainObject: selectedParent,
                    property: function () {
                        return getPath() + ".useGrid";
                    },
                    options: [
                        {
                            value: false,
                            icon: "icon-grid-snap-to",
                            title: "Grid snapping enabled"
                        },
                        {
                            value: true,
                            icon: "icon-grid-snap-no",
                            title: "Grid snapping disabled"
                        }
                    ]
                };
                let x = {
                    control: "input",
                    type: "number",
                    domainObject: selectedParent,
                    property: function () {
                        return getPath() + ".x";
                    },
                    label: "X:",
                    title: "X position"
                },
                y = {
                    control: "input",
                    type: "number",
                    domainObject: selectedParent,
                    property: function () {
                        return getPath() + ".y";
                    },
                    label: "Y:",
                    title: "Y position",
                },
                width = {
                    control: 'input',
                    type: 'number',
                    domainObject: selectedParent,
                    property: function () {
                        return getPath() + ".width";
                    },
                    label: 'W:',
                    title: 'Resize object width'
                },
                height = {
                    control: 'input',
                    type: 'number',
                    domainObject: selectedParent,
                    property: function () {
                        return getPath() + ".height";
                    },
                    label: 'H:',
                    title: 'Resize object height'
                };

                if (layoutItem.type === 'subobject-view') {
                    if (toolbar.length > 0) {
                        toolbar.push(separator);
                    }

                    toolbar.push({
                        control: "toggle-button",
                        domainObject: selectedParent,
                        property: function () {
                            return getPath() + ".hasFrame";
                        },
                        options: [
                            {
                                value: false,
                                icon: 'icon-frame-show',
                                title: "Frame visible"
                            },
                            {
                                value: true,
                                icon: 'icon-frame-hide',
                                title: "Frame hidden"
                            }
                        ]
                    });
                    toolbar.push(separator);
                    toolbar.push(stackOrder);
                    toolbar.push(x);
                    toolbar.push(y);
                    toolbar.push(width);
                    toolbar.push(height);
                    toolbar.push(useGrid);
                    toolbar.push(separator);
                    toolbar.push(remove);
                } else {
                    const TEXT_SIZE = [8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 30, 36, 48, 72, 96, 128];
                    let fill = {
                        control: "color-picker",
                        domainObject: selectedParent,
                        property: function () {
                            return getPath() + ".fill";
                        },
                        icon: "icon-paint-bucket",
                        title: "Set fill color"
                    },
                    stroke = {
                        control: "color-picker",
                        domainObject: selectedParent,
                        property: function () {
                            return getPath() + ".stroke";
                        },
                        icon: "icon-line-horz",
                        title: "Set border color"
                    },
                    color = {
                        control: "color-picker",
                        domainObject: selectedParent,
                        property: function () {
                            return getPath() + ".color";
                        },
                        icon: "icon-font",
                        mandatory: true,
                        title: "Set text color",
                        preventNone: true
                    },
                    size = {
                        control: "select-menu",
                        domainObject: selectedParent,
                        property: function () {
                            return getPath() + ".size";
                        },
                        title: "Set text size",
                        options: TEXT_SIZE.map(size => {
                            return {
                                value: size + "px"
                            };
                        })
                    };

                    if (layoutItem.type === 'telemetry-view') {
                        let displayMode = {
                            control: "select-menu",
                            domainObject: selectedParent,
                            property: function () {
                                return getPath() + ".displayMode";
                            },
                            title: "Set display mode",
                            options: [
                                {
                                    name: 'Label + Value',
                                    value: 'all'
                                },
                                {
                                    name: "Label only",
                                    value: "label"
                                },
                                {
                                    name: "Value only",
                                    value: "value"
                                }
                            ]
                        },
                        value = {
                            control: "select-menu",
                            domainObject: selectedParent,
                            property: function () {
                                return getPath() + ".value";
                            },
                            title: "Set value",
                            options: openmct.telemetry.getMetadata(selectedObject).values().map(value => {
                                return {
                                    name: value.name,
                                    value: value.key
                                }
                            })
                        };
                        toolbar = [
                            displayMode,
                            separator,
                            value,
                            separator,
                            fill,
                            stroke,
                            color,
                            separator,
                            size,
                            separator,
                            stackOrder,
                            x,
                            y,
                            height,
                            width,
                            useGrid,
                            separator,
                            remove
                        ];
                    } else if (layoutItem.type === 'text-view') {
                        let text = {
                            control: "button",
                            domainObject: selectedParent,
                            property: function () {
                                return getPath();
                            },
                            icon: "icon-gear",
                            title: "Edit text properties",
                            dialog: DIALOG_FORM['text']
                        };
                        toolbar = [
                            fill,
                            stroke,
                            separator,
                            color,
                            size,
                            separator,
                            stackOrder,
                            x,
                            y,
                            height,
                            width,
                            useGrid,
                            separator,
                            text,
                            separator,
                            remove
                        ];
                    } else if (layoutItem.type === 'box-view') {
                        toolbar = [
                            fill,
                            stroke,
                            separator,
                            stackOrder,
                            x,
                            y,
                            height,
                            width,
                            useGrid,
                            separator,
                            remove
                        ];
                    } else if (layoutItem.type === 'image-view') {
                        let url = {
                            control: "button",
                            domainObject: selectedParent,
                            property: function () {
                                return getPath();
                            },
                            icon: "icon-image",
                            title: "Edit image properties",
                            dialog: DIALOG_FORM['image']
                        };
                        toolbar = [
                            stroke,
                            separator,
                            stackOrder,
                            x,
                            y,
                            height,
                            width,
                            useGrid,
                            separator,
                            url,
                            separator,
                            remove
                        ];
                    } else if (layoutItem.type === 'line-view') {
                        let x2 = {
                            control: "input",
                            type: "number",
                            domainObject: selectedParent,
                            property: function () {
                                return getPath() + ".x2";
                            },
                            label: "X2:",
                            title: "X2 position"
                        },
                        y2 = {
                            control: "input",
                            type: "number",
                            domainObject: selectedParent,
                            property: function () {
                                return getPath() + ".y2";
                            },
                            label: "Y2:",
                            title: "Y2 position",
                        };
                        toolbar = [
                            stroke,
                            separator,
                            stackOrder,
                            x,
                            y,
                            x2,
                            y2,
                            useGrid,
                            separator,
                            remove
                        ];
                    }
                }

                return toolbar;
            }
        }
    }

    return DisplayLayoutToolbar;
});
