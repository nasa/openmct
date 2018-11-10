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
                // Apply the layout toolbar if the selected object is inside a layout,
                // and in edit mode.
                return (selection &&
                    selection[1] &&
                    selection[1].context.item &&
                    selection[1].context.item.type === 'layout' &&
                    openmct.editor.isEditing());
            },
            toolbar: function (selection) {
                let domainObject = selection[1].context.item;
                let layoutItem = selection[0].context.layoutItem;

                if (layoutItem && layoutItem.type === 'telemetry-view') {
                    let path = "configuration.alphanumerics[" + layoutItem.config.alphanumeric.index + "]";
                    let metadata = openmct.telemetry.getMetadata(layoutItem.domainObject);
                    const TEXT_SIZE = [9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 30, 36, 48, 72, 96];

                    return [
                        {
                            control: "select-menu",
                            domainObject: domainObject,
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
                            domainObject: domainObject,
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
                            domainObject: domainObject,
                            property: path + ".fill",
                            icon: "icon-paint-bucket",
                            title: "Set fill color"
                        },
                        {
                            control: "color-picker",
                            domainObject: domainObject,
                            property: path + ".stroke",
                            icon: "icon-line-horz",
                            title: "Set border color"
                        },
                        {
                            control: "color-picker",
                            domainObject: domainObject,
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
                            domainObject: domainObject,
                            property: path + ".size",
                            title: "Set text size",
                            options: TEXT_SIZE.map(size => {
                                return {
                                    value: size + "px"
                                };
                            })
                        },
                    ];
                } else {
                    return [
                        {
                            control: "toggle-button",
                            domainObject: domainObject,
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
                        }
                    ];    
                }
            }
        }
    }

    return DisplayLayoutToolbar;
});