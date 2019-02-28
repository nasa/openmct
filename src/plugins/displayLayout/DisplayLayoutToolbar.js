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
                // Apply the layout toolbar if the edit mode is on, and the selected object
                // is inside a layout, or the main layout is selected.
                if (!selection || selection.length === 0) {
                    return false;
                }

                let selectionPath = selection[0];
                let selectedObject = selectionPath[0];
                let selectedParent = selectionPath[1];

                return (openmct.editor.isEditing() &&
                    ((selectedParent && selectedParent.context.item && selectedParent.context.item.type === 'layout') ||
                    (selectedObject.context.item && selectedObject.context.item.type === 'layout')));
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

                function getPath(selectionPath) {
                    return `configuration.items[${selectionPath[0].context.index}]`;
                }

                function getAllTypes(selection) {
                    return selection.filter(selectionPath => {
                        let type = selectionPath[0].context.layoutItem.type;
                        return type === 'text-view' ||
                            type === 'telemetry-view' ||
                            type === 'box-view' ||
                            type === 'image-view' ||
                            type === 'line-view' ||
                            type === 'subobject-view';
                    });
                }

                function getAddButton(selectedObject, selectionPath) {
                    return {
                        control: "menu",
                        domainObject: selectedObject,
                        method: function (option) {
                            let name = option.name.toLowerCase();
                            let form = DIALOG_FORM[name];
                            if (form) {
                                getUserInput(form)
                                    .then(element => selectionPath[0].context.addElement(name, element));
                            } else {
                                selectionPath[0].context.addElement(name);
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
                    };
                }

                function getToggleFrameButton(selectedParent, selection) {
                    return {
                        control: "toggle-button",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => 
                            selectionPath[0].context.layoutItem.type === 'subobject-view'
                        ),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".hasFrame";
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
                    };
                }

                function getRemoveButton(selectedParent, selectionPath) {
                    return {
                        control: "button",
                        domainObject: selectedParent,
                        icon: "icon-trash",
                        title: "Delete the selected object",
                        method: function () {
                            let removeItem = selectionPath[1].context.removeItem;
                            let prompt = openmct.overlays.dialog({
                                iconClass: 'alert',
                                message: `Warning! This action will remove this item from the Display Layout. Do you want to continue?`,
                                buttons: [
                                    {
                                        label: 'Ok',
                                        emphasis: 'true',
                                        callback: function () {
                                            removeItem(layoutItem, selectionPath[0].context.index);
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
                }

                function getStackOrder(selectedParent, selectionPath) {
                    return {
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
                            selectionPath[1].context.orderItem(option.value, selectionPath[0].context.index);
                        }
                    };
                }

                function getSnapToGridButton(selectedParent, selection) {
                    return {
                        control: "toggle-button",
                        domainObject: selectedParent,
                        applicableSelectedItems: getAllTypes(selection),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".useGrid";
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
                }

                function getXInput(selectedParent, selection) {
                    return {
                        control: "input",
                        type: "number",
                        domainObject: selectedParent,
                        applicableSelectedItems: getAllTypes(selection),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".x";
                        },
                        label: "X:",
                        title: "X position"
                    };
                }

                function getYInput(selectedParent, selection) {
                    return {
                        control: "input",
                        type: "number",
                        domainObject: selectedParent,
                        applicableSelectedItems: getAllTypes(selection),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".y";
                        },
                        label: "Y:",
                        title: "Y position",
                    };
                }

                function getWidthInput(selectedParent, selection) {
                    return {
                        control: 'input',
                        type: 'number',
                        domainObject: selectedParent,
                        applicableSelectedItems: getAllTypes(selection),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".width";
                        },
                        label: 'W:',
                        title: 'Resize object width'
                    };
                }

                function getHeightInput(selectedParent, selection) {
                    return {
                        control: 'input',
                        type: 'number',
                        domainObject: selectedParent,
                        applicableSelectedItems: getAllTypes(selection),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".width";
                        },
                        label: 'W:',
                        title: 'Resize object width'
                    };
                }

                function getX2Input(selectedParent, selection) {
                    return {
                        control: "input",
                        type: "number",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            return selectionPath[0].context.layoutItem.type === 'line-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".x2";
                        },
                        label: "X2:",
                        title: "X2 position"
                    };
                }

                function getY2Input(selectedParent, selection) {
                    return {
                        control: "input",
                        type: "number",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            return selectionPath[0].context.layoutItem.type === 'line-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".y2";
                        },
                        label: "Y2:",
                        title: "Y2 position",
                    };
                }

                function getSizeMenu(selectedParent, selection) {
                    const TEXT_SIZE = [8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 30, 36, 48, 72, 96, 128];
                    return {
                        control: "select-menu",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            let type = selectionPath[0].context.layoutItem.type;
                            return type === 'text-view' || type === 'telemetry-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".size";
                        },
                        title: "Set text size",
                        options: TEXT_SIZE.map(size => {
                            return {
                                value: size + "px"
                            };
                        })
                    };
                }

                function getFillMenu(selectedParent, selection) {
                    return {
                        control: "color-picker",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            let type = selectionPath[0].context.layoutItem.type;
                            return type === 'text-view' ||
                                type === 'telemetry-view' ||
                                type === 'box-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".fill";
                        },
                        icon: "icon-paint-bucket",
                        title: "Set fill color"
                    };
                }

                function getStrokeMenu(selectedParent, selection) {
                    return {
                        control: "color-picker",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            let type = selectionPath[0].context.layoutItem.type;
                            return type === 'text-view' ||
                                type === 'telemetry-view' ||
                                type === 'box-view' ||
                                type === 'image-view' ||
                                type === 'line-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".stroke";
                        },
                        icon: "icon-line-horz",
                        title: "Set border color"
                    };
                }

                function getFontColorMenu(selectedParent, selection) {
                    return {
                        control: "color-picker",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            let type = selectionPath[0].context.layoutItem.type;
                            return type === 'text-view' || type === 'telemetry-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".color";
                        },
                        icon: "icon-font",
                        mandatory: true,
                        title: "Set text color",
                        preventNone: true
                    };
                }

                function getURLButton(selectedParent, selection) {
                    return {
                        control: "button",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            return selectionPath[0].context.layoutItem.type === 'image-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath);
                        },
                        icon: "icon-image",
                        title: "Edit image properties",
                        dialog: DIALOG_FORM['image']
                    };
                }

                function getTextButton(selectedParent, selection) {
                    return {
                        control: "button",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            return selectionPath[0].context.layoutItem.type === 'text-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath);
                        },
                        icon: "icon-gear",
                        title: "Edit text properties",
                        dialog: DIALOG_FORM['text']
                    };
                }

                function getTelemtryValueMenu(selectedParent, selection) {
                    return {
                        control: "select-menu",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            return selectionPath[0].context.layoutItem.type === 'telemetry-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".value";
                        },
                        title: "Set value",
                        options: openmct.telemetry.getMetadata(selection[0][0].context.item).values().map(value => {
                            return {
                                name: value.name,
                                value: value.key
                            }
                        })
                    };
                }

                function getDisplayModeMenu(selectedParent, selection) {
                    return {
                        control: "select-menu",
                        domainObject: selectedParent,
                        applicableSelectedItems: selection.filter(selectionPath => {
                            return selectionPath[0].context.layoutItem.type === 'telemetry-view';
                        }),
                        property: function (selectionPath) {
                            return getPath(selectionPath) + ".displayMode";
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
                    }
                }

                function getSeparator() {
                    return {
                        control: "separator"
                    };
                }

                let selectionPath = selection[0];
                    selectedParent = selectionPath[1] && selectionPath[1].context.item,
                    selectedObject = selectionPath[0].context.item,
                    layoutItem = selectionPath[0].context.layoutItem,
                    toolbar = [];

                if (selectedObject && selectedObject.type === 'layout') {
                    toolbar.push(getAddButton(selectedObject, selectionPath));
                }

                if (!layoutItem) {
                    return toolbar;
                }

                let separator = getSeparator(),
                    stackOrder = getStackOrder(selectedParent, selectionPath),
                    x = getXInput(selectedParent, selection),
                    y = getYInput(selectedParent, selection),
                    useGrid = getSnapToGridButton(selectedParent, selection),
                    remove = getRemoveButton(selectedParent, selectionPath);

                if (layoutItem.type === 'subobject-view') {
                    if (toolbar.length > 0) {
                        toolbar.push(separator);
                    }

                    toolbar.push(getToggleFrameButton(selectedParent, selection));
                    toolbar.push(separator);
                    toolbar.push(stackOrder,);
                    toolbar.push(x);
                    toolbar.push(y);
                    toolbar.push(getWidthInput(selectedParent, selection));
                    toolbar.push(getHeightInput(selectedParent, selection));
                    toolbar.push(useGrid);
                    toolbar.push(separator);
                    toolbar.push(remove);
                } else {
                    if (layoutItem.type === 'telemetry-view') {
                        toolbar = [
                            getDisplayModeMenu(selectedParent, selectio),
                            separator,
                            getTelemtryValueMenu(selectedParent, selection),
                            separator,
                            getFillMenu(selectedParent, selection),
                            getStrokeMenu(selectedParent, selection),
                            getFontColorMenu(selectedParent, selection),
                            separator,
                            getSizeMenu(selectedParent, selection),
                            separator,
                            stackOrder,
                            x,
                            y,
                            getHeightInput(selectedParent, selection),
                            getWidthInput(selectedParent, selection),
                            useGrid,
                            separator,
                            remove
                        ];
                    } else if (layoutItem.type === 'text-view') {
                        toolbar = [
                            getFillMenu(selectedParent, selection),
                            getStrokeMenu(selectedParent, selection),
                            separator,
                            getFontColorMenu(selectedParent, selection),
                            getSizeMenu(selectedParent, selection),
                            separator,
                            stackOrder,
                            x,
                            y,
                            getHeightInput(selectedParent, selection),
                            getWidthInput(selectedParent, selection),
                            useGrid,
                            separator,
                            getTextButton(selectedParent, selection),,
                            separator,
                            remove
                        ];
                    } else if (layoutItem.type === 'box-view') {
                        toolbar = [
                            getFillMenu(selectedParent, selection),
                            getStrokeMenu(selectedParent, selection),
                            separator,
                            stackOrder,
                            x,
                            y,
                            getHeightInput(selectedParent, selection),
                            getWidthInput(selectedParent, selection),
                            useGrid,
                            separator,
                            remove
                        ];
                    } else if (layoutItem.type === 'image-view') {
                        toolbar = [
                            getStrokeMenu(selectedParent, selection),
                            separator,
                            stackOrder,
                            x,
                            y,
                            getHeightInput(selectedParent, selection),
                            getWidthInput(selectedParent, selection),
                            useGrid,
                            separator,
                            getURLButton(selectedParent, selection),
                            separator,
                            remove
                        ];
                    } else if (layoutItem.type === 'line-view') {
                        toolbar = [
                            getStrokeMenu(selectedParent, selection),
                            separator,
                            stackOrder,
                            x,
                            y,
                            getX2Input(selectedParent, selection),
                            getY2Input(selectedParent, selection),
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
