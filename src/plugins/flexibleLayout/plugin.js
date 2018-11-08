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
    './flexibleLayoutViewProvider',
    './utils/container'
], function (
    FlexibleLayoutViewProvider,
    Container
) {
    return function plugin() {

        return function install(openmct) {
            openmct.objectViews.addProvider(new FlexibleLayoutViewProvider(openmct));

            openmct.types.addType('flexible-layout', {
                name: "Flexible Layout",
                creatable: true,
                description: "A fluid, flexible layout canvas that can display multiple objects in rows or columns.",
                cssClass: 'icon-flexible-layout',
                initialize: function (domainObject) {
                    domainObject.configuration = {
                        containers: [new Container.default(50), new Container.default(50)],
                        rowsLayout: false
                    };
                }
            });

            openmct.toolbars.addProvider({
                name: "Flexible Layout Toolbar",
                key: "flex-layout",
                description: "A toolbar for objects inside a Flexible Layout.",
                forSelection: function (selection) {
                    let context = selection[0].context;

                    return (openmct.editor.isEditing() && context && context.type &&
                        (context.type === 'flexible-layout' || context.type === 'container' || context.type === 'frame'));
                },
                toolbar: function (selection) {

                    let primary = selection[0],
                        parent = selection[1],
                        deleteFrame,
                        toggleContainer,
                        deleteContainer,
                        addContainer,
                        toggleFrame,
                        separator;

                    addContainer = {
                        control: "button",
                        domainObject: parent ? parent.context.item : primary.context.item,
                        method: parent ? parent.context.addContainer : primary.context.addContainer,
                        key: "add",
                        icon: "icon-plus-in-rect",
                        title: 'Add Container'
                    };

                    separator = {
                        control: "separator",
                        domainObject: selection[0].context.item,
                        key: "separator"
                    };

                    toggleContainer = {
                        control: 'toggle-button',
                        key: 'toggle-layout',
                        domainObject: parent ? parent.context.item : primary.context.item,
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
                    };

                    if (primary.context.type === 'frame') {

                        deleteFrame = {
                            control: "button",
                            domainObject: primary.context.item,
                            method: primary.context.method,
                            key: "remove",
                            icon: "icon-trash",
                            title: "Remove Frame"
                        };
                        toggleFrame = {
                            control: "toggle-button",
                            domainObject: parent.context.item,
                            property: `configuration.containers[${parent.context.index}].frames[${primary.context.index}].noFrame`,
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
                        };


                    } else if (primary.context.type === 'container') {

                        deleteContainer = {
                            control: "button",
                            domainObject: primary.context.item,
                            method: primary.context.method,
                            key: "remove",
                            icon: "icon-trash",
                            title: "Remove Container"
                        };

                    } else if (primary.context.type === 'flexible-layout') {

                        addContainer = {
                            control: "button",
                            domainObject: primary.context.item,
                            method: primary.context.addContainer,
                            key: "add",
                            icon: "icon-plus-in-rect",
                            title: 'Add Container'
                        };

                    }

                    let toolbar = [toggleContainer, addContainer, toggleFrame, separator, deleteFrame, deleteContainer];

                    return toolbar.filter(button => button !== undefined);
                }
            });
        };
    };
});
