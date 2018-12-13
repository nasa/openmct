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
    "./src/controllers/NotebookController"
], function (
    NotebookController
) {
    var installed  = false;

    function NotebookPlugin() {
        return function install(openmct) {
            if (installed) {
                return;
            }

            installed = true;

            openmct.legacyRegistry.register('notebook', {
                name: 'Notebook Plugin',
                extensions: {
                    types: [
                        {
                            key: 'notebook',
                            name: 'Notebook',
                            cssClass: 'icon-notebook',
                            description: 'Create and save timestamped notes with embedded object snapshots.',
                            features: 'creation',
                            model: {
                                entries: [],
                                entryTypes: [],
                                defaultSort: 'oldest'
                            },
                            properties: [
                                {
                                    key: 'defaultSort',
                                    name: 'Default Sort',
                                    control: 'select',
                                    options: [
                                        {
                                            name: 'Newest First',
                                            value: "newest"
                                        },
                                        {
                                            name: 'Oldest First',
                                            value: "oldest"
                                        }
                                    ],
                                    cssClass: 'l-inline'
                                }
                            ]
                        }
                    ]
                }
            });

            openmct.legacyRegistry.enable('notebook');

            openmct.objectViews.addProvider({
                key: 'notebook-vue',
                name: 'Notebook View',
                cssClass: 'icon-notebook',
                canView: function (domainObject) {
                    return domainObject.type === 'notebook';
                },
                view: function (domainObject) {
                    var controller = new NotebookController (openmct, domainObject);

                    return {
                        show: controller.show,
                        destroy: controller.destroy
                    };
                }
            });
        };

    }

    return NotebookPlugin;
});
