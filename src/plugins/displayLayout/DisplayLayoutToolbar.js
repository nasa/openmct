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
                return (openmct.editor.isEditing() && selection &&
                    ((selection[1] && selection[1].context.item && selection[1].context.item.type === 'layout') ||
                    (selection[0].context.item && selection[0].context.item.type === 'layout')));
            },
            toolbar: function (selection) {
                let selectedParent = selection[1] && selection[1].context.item;
                let selectedObject = selection[0].context.item;
                let layoutItem = selection[0].context.layoutItem;

                if (layoutItem && layoutItem.type === 'telemetry-view') {
                    let path = "configuration.alphanumerics[" + layoutItem.config.alphanumeric.index + "]";
                    let metadata = openmct.telemetry.getMetadata(layoutItem.domainObject);
                    const TEXT_SIZE = [9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 30, 36, 48, 72, 96];

                    return [
                        {
                            control: "select-menu",
                            domainObject: selectedParent,
                            property: path + ".displayMode",
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
                        {
                            control: "separator"
                        },
                        {
                            control: "select-menu",
                            domainObject: selectedParent,
                            property: path + ".value",
                            title: "Set value",
                            options: metadata.values().map(value => {
                                return {
                                    name: value.name,
                                    value: value.key
                                }
                            })
                        },
                        {
                            control: "separator"
                        },
                        {
                            control: "color-picker",
                            domainObject: selectedParent,
                            property: path + ".fill",
                            icon: "icon-paint-bucket",
                            title: "Set fill color"
                        },
                        {
                            control: "color-picker",
                            domainObject: selectedParent,
                            property: path + ".stroke",
                            icon: "icon-line-horz",
                            title: "Set border color"
                        },
                        {
                            control: "color-picker",
                            domainObject: selectedParent,
                            property: path + ".color",
                            icon: "icon-font",
                            mandatory: true,
                            title: "Set text color",
                            preventNone: true
                        },
                        {
                            control: "separator"
                        },
                        {
                            control: "select-menu",
                            domainObject: selectedParent,
                            property: path + ".size",
                            title: "Set text size",
                            options: TEXT_SIZE.map(size => {
                                return {
                                    value: size + "px"
                                };
                            })
                        },
                    ];
                } else if (layoutItem && (layoutItem.type === 'text-view' || layoutItem.type === 'box-view' ||
                    layoutItem.type === 'image-view' || layoutItem.type === 'line-view')) {
                    return [];    
                } else {
                    let toolbar = [];

                    if (selectedObject && selectedObject.type === 'layout') {
                        toolbar.push({
                            control: "menu",
                            domainObject: selectedObject,
                            method: function (option) {
                                selection[0].context.displayLayout.addElement(option.key);
                            },
                            key: "add",
                            icon: "icon-plus",
                            label: "Add",
                            options: [
                                {
                                    "name": "Box",
                                    "class": "icon-box",
                                    "key": "box"
                                },
                                {
                                    "name": "Line",
                                    "class": "icon-line-horz",
                                    "key": "line"
                                },
                                {
                                    "name": "Text",
                                    "class": "icon-T",
                                    "key": "text"
                                },
                                {
                                    "name": "Image",
                                    "class": "icon-image",
                                    "key": "image"
                                }
                            ]
                        });
                    }

                    if (selectedParent) {
                        // TODO: get the selectedObject id instead of using layoutItem.id
                        toolbar.push({
                            control: "toggle-button",
                            domainObject: selectedParent,
                            property: "configuration.panels[" + layoutItem.id + "].hasFrame",
                            options: [
                                {
                                    value: false,
                                    icon: 'icon-frame-hide',
                                    title: "Hide frame"
                                },
                                {
                                    value: true,
                                    icon: 'icon-frame-show',
                                    title: "Show frame"
                                }
                            ]
                        });
                    }

                    return toolbar;
                }
            }
        }
    }

    return DisplayLayoutToolbar;
});