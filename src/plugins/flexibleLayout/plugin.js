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
                    // Apply the layout toolbar if the selected object is inside a layout,
                    // and in edit mode.
                    return (selection[0] && openmct.editor.isEditing());
                },
                toolbar: function (selection) {

                    if (selection[0].context.type === 'frame' || selection[0].context.type === 'container') {

                        return [
                            {
                                control: "button",
                                domainObject: selection[0].context.item,
                                method: selection[0].context.method,
                                key: "remove",
                                icon: "icon-trash",
                                title: `Remove ${selection[0].context.type}`
                            },
                            {
                                control: 'toggle-button',
                                key: 'toggle-layout',
                                domainObject: selection[1].context.item,
                                property: 'configuration.rowsLayout',
                                options: [
                                    {
                                        value: false,
                                        icon: 'icon-grid-snap-no',
                                        title: 'Columns'
                                    },
                                    {
                                        value: true,
                                        icon: 'icon-grid-snap-to',
                                        title: 'Rows'
                                    }
                                ]
                            },
                            {
                                control: "button",
                                domainObject: selection[0].context.item,
                                method: selection[0].context.addContainer,
                                key: "add",
                                icon: "icon-plus",
                                title: `Add Container`
                            }
                        ];
                    } else {
                        return [
                            {
                                control: 'toggle-button',
                                key: 'toggle-layout',
                                domainObject: selection[0].context.item,
                                property: 'configuration.rowsLayout',
                                options: [
                                    {
                                        value: false,
                                        icon: 'icon-grid-snap-no',
                                        title: 'Columns'
                                    },
                                    {
                                        value: true,
                                        icon: 'icon-grid-snap-to',
                                        title: 'Rows'
                                    }
                                ]
                            }
                        ];
                    }
                }
            });
        };
    };
});
