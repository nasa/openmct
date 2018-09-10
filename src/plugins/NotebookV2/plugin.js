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
    "./src/controllers/NotebookController",
    "./src/controllers/NewEntryController",
    "./src/controllers/SelectSnapshotController",
    "./src/actions/NewEntryContextual",
    "./src/actions/AnnotateSnapshot",
    "./src/directives/MCTSnapshot",
    "./src/directives/EntryDnd",
    "text!./res/templates/controls/snapSelect.html",
    "text!./res/templates/controls/embedControl.html",
    "text!./res/templates/annotation.html",
    "text!./res/templates/draggedEntry.html"
 ], function (
    NotebookController,
    NewEntryController,
    SelectSnapshotController,
    newEntryAction,
    AnnotateSnapshotAction,
    MCTSnapshotDirective,
    EntryDndDirective,
    snapSelectTemplate,
    embedControlTemplate,
    annotationTemplate,
    draggedEntryTemplate
 ) {
    var installed  = false;

    function NotebookV2Plugin() {
        return function install(openmct) {
            if (installed) {
                return;
            }

            installed = true;

            openmct.legacyRegistry.register('notebookV2', {
                name: 'Notebook Plugin',
                extensions: {
                    types: [
                        {
                            key: 'notebookV2',
                            name: 'NotebookV2',
                            cssClass: 'icon-notebook',
                            description: 'Create and save timestamped notes with embedded object snapshots.',
                            features: 'creation',
                            model: {
                                entries: [],
                                composition: [],
                                entryTypes: [],
                                defaultSort: '-createdOn'
                            },
                            properties: [
                                {
                                    key: 'defaultSort',
                                    name: 'Default Sort',
                                    control: 'select',
                                    options: [
                                        {
                                            name: 'Newest First',
                                            value: "-createdOn",
                                        },
                                        {
                                            name: 'Oldest First',
                                            value: "createdOn"
                                        }
                                    ],
                                    cssClass: 'l-inline'
                                }
                            ]
                        }
                    ],
                    actions: [
                        {
                            "key": "notebook-new-entry",
                            "implementation": newEntryAction,
                            "name": "New Notebook Entry",
                            "cssClass": "icon-notebook labeled",
                            "description": "Add a new Notebook entry",
                            "category": [
                                "view-control"
                            ],
                            "depends": [
                            "$compile",
                            "$rootScope",
                            "dialogService",
                            "notificationService",
                            "linkService"
                            ],
                            "priority": "preferred"
                        },
                        {
                            "key": "annotate-snapshot",
                            "implementation": AnnotateSnapshotAction,
                            "name": "Annotate Snapshot",
                            "cssClass": "icon-pencil labeled",
                            "description": "Annotate embed's snapshot",
                            "category": "embed",
                            "depends": [
                              "dialogService",
                              "dndService",
                              "$rootScope"
                            ]
                        }
                    ],
                    controllers: [
                        {
                            "key": "NewEntryController",
                            "implementation": NewEntryController,
                            "depends": ["$scope",
                                         "$rootScope"
                                        ]
                        },
                        {
                            "key": "selectSnapshotController",
                            "implementation": SelectSnapshotController,
                            "depends": ["$scope",
                                         "$rootScope"
                                        ]
                        }
                    ],
                    controls: [
                        {
                            "key": "snapshot-select",
                            "template":  snapSelectTemplate
                        },
                        {
                            "key": "embed-control",
                            "template": embedControlTemplate
                        }
                    ],
                    templates: [
                        {
                            "key": "annotate-snapshot",
                            "template": annotationTemplate
                        }
                    ],
                    directives: [
                        {
                            "key": "mctSnapshot",
                            "implementation": MCTSnapshotDirective,
                            "depends": [
                                "$rootScope",
                                "$document",
                                "exportImageService",
                                "dialogService",
                                "notificationService"
                            ]
                        },
                        {
                            "key": "mctEntryDnd",
                            "implementation": EntryDndDirective,
                            "depends": [
                                "$rootScope",
                                "$compile",
                                "dndService",
                                "typeService",
                                "notificationService"
                            ]
                        }
                    ],
                    representations: [
                        {
                            "key": "draggedEntry",
                            "template": draggedEntryTemplate
                        }
                    ]
                }
            });

            openmct.legacyRegistry.enable('notebookV2');

            openmct.objectViews.addProvider({
                key: 'notebook-vue',
                name: 'Notebook View',
                cssClass: 'icon-notebook',
                canView: function (domainObject) {
                    return domainObject.type === 'notebookV2';
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

    return NotebookV2Plugin;
 });