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
    './flexibleLayout'
], function (
    FlexibleLayout
) {
    return function plugin() {

        return function install(openmct) {
            openmct.objectViews.addProvider(new FlexibleLayout(openmct));

            openmct.types.addType('flexible-layout', {
                name: "Flexible Layout",
                creatable: true,
                description: "A fluid, flexible layout canvas that can display multiple objects in rows or columns.",
                cssClass: 'icon-flexible-layout',
                initialize: function (domainObject) {
                    domainObject.configuration = {
                        containers: [],
                        rowsLayout: false
                    };
                }
            });

            openmct.toolbars.addProvider({
                name: "Flexible Layout Toolbar",
                key: "flex-layout",
                description: "A toolbar for objects inside a Flexible Layout.",
                forSelection: function (selection) {
                    let parent = selection[selection.length - 1];

                    return (parent && parent.context.item &&
                        parent.context.item.type === 'flexible-layout' &&
                        openmct.editor.isEditing());
                },
                toolbar: function (selection) {
                    let domainObject = selection[selection.length - 1].context.item;

                    let deleteButton = {
                            control: "button",
                            domainObject: selection[0].context.item,
                            method: selection[0].context.method,
                            key: "remove",
                            icon: "icon-trash",
                            title: `Remove ${selection[0].context.type}`
                        },
                        toggleButton = {
                            control: 'toggle-button',
                            key: 'toggle-layout',
                            domainObject: domainObject,
                            property: 'configuration.rowsLayout',
                            options: [
                                {
                                    value: false,
                                    icon: 'icon-columns',
                                    title: 'Columns'
                                },
                                {
                                    value: true,
                                    icon: 'icon-rows',
                                    title: 'Rows'
                                }
                            ]
                        },
                        addContainerButton = {
                            control: "button",
                            domainObject: selection[0].context.item,
                            method: selection[0].context.addContainer,
                            key: "add",
                            icon: "icon-plus-in-rect",
                            title: 'Add Container'
                        },
                        separator = {
                            control: "separator",
                            domainObject: selection[0].context.item,
                            key: "separator"
                        };

                    if (selection[0].context.type === 'container') {

                        return [toggleButton, addContainerButton, separator, deleteButton];

                    } else if (selection[0].context.type === 'frame') {
                        let context = selection[0].context;
                        let toggleFrame = {
                            control: "toggle-button",
                            domainObject: context.parentDomainObject,
                            property: `configuration.containers[${context.containerIndex}].frames[${context.frameIndex}].noFrame`,
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

                        return [toggleButton, toggleFrame, addContainerButton, separator, deleteButton];

                    } else if (selection[0].context.type === 'flexible-layout') {

                        return [toggleButton, addContainerButton];

                    } else {

                        return [toggleButton];
                    }
                }
            });
        };
    };
});
