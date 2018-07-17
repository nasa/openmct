/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
define(
    [],
    function () {

        var SNAPSHOT_TEMPLATE = '<mct-representation key="\'draggedEntry\'"' +
                                    'class="t-rep-frame holder"' +
                                    'mct-object="selObj">' +
                                '</mct-representation>';

        var NEW_TASK_FORM = {
            name: "Create a Notebook Entry",
            hint: "Please select one Notebook",
            sections: [{
                rows: [{
                    name: 'Entry',
                    key: 'entry',
                    control: 'textarea',
                    required: false,
                    "cssClass": "l-textarea-sm"
                },
                {
                    name: 'Embed Type',
                    key: 'withSnapshot',
                    control: 'snapshot-select',
                    "options": [
                        {
                            "name": "Link and Snapshot",
                            "value": true
                        },
                        {
                            "name": "Link only",
                            "value": false
                        }
                    ]
                },
                {
                    name: 'Embed',
                    key: 'embedObject',
                    control: 'embed-control'
                },
                {
                    name: 'Save in Notebook',
                    key: 'saveNotebook',
                    control: 'locator',
                    validate: validateLocation
                }]
            }]
        };

        function NewEntryContextual($compile, $rootScope, dialogService, notificationService, linkService, context) {
            context = context || {};
            this.domainObject = context.selectedObject || context.domainObject;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.linkService = linkService;
            this.$rootScope = $rootScope;
            this.$compile = $compile;
        }

        function validateLocation(newParentObj) {
            return newParentObj.model.type === 'notebook';
        }


        NewEntryContextual.prototype.perform = function () {
            var self = this;
            var domainObj = this.domainObject;
            var notification = this.notificationService;
            var dialogService = this.dialogService;
            var rootScope = this.$rootScope;
            rootScope.newEntryText = '';
            // Create the overlay element and add it to the document's body
            this.$rootScope.selObj = domainObj;
            this.$rootScope.selValue = "";
            var newScope = rootScope.$new();
            newScope.selObj = domainObj;
            newScope.selValue = "";
            this.$compile(SNAPSHOT_TEMPLATE)(newScope);

            this.$rootScope.$watch("snapshot", setSnapshot);

            function setSnapshot(value) {
                if (value === "annotationCancelled") {
                    rootScope.snapshot = rootScope.lastValue;
                    rootScope.lastValue = '';

                } else if (value && value !== rootScope.lastValue) {
                    var overlayModel = {
                        title: NEW_TASK_FORM.name,
                        message: NEW_TASK_FORM.message,
                        structure: NEW_TASK_FORM,
                        value: {'entry': rootScope.newEntryText || ""}
                    };

                    rootScope.currentDialog = overlayModel;

                    dialogService.getDialogResponse(
                        "overlay-dialog",
                        overlayModel,
                        function () {
                            return overlayModel.value;
                        }
                    ).then(addNewEntry);

                    rootScope.lastValue = value;
                }
            }

            function addNewEntry(options) {
                options.selectedModel = options.embedObject.getModel();
                options.cssClass = options.embedObject.getCapability('type').typeDef.cssClass;
                if (self.$rootScope.snapshot) {
                    options.snapshot = self.$rootScope.snapshot;
                    self.$rootScope.snapshot = undefined;
                }else {
                    options.snapshot = undefined;
                }

                if (!options.withSnapshot) {
                    options.snapshot = '';
                }

                createSnap(options);
            }

            function createSnap(options) {
                options.saveNotebook.useCapability('mutation', function (model) {
                    var entries = model.entries;
                    var lastEntry = entries[entries.length - 1];
                    var date = Date.now();

                    if (lastEntry === undefined || lastEntry.text || lastEntry.embeds) {
                        model.entries.push({
                            'id': date,
                            'createdOn': date,
                            'text': options.entry,
                            'embeds': [{'type': options.embedObject.getId(),
                                       'id': '' + date,
                                       'cssClass': options.cssClass,
                                       'name': options.selectedModel.name,
                                       'snapshot': options.snapshot
                                     }]
                        });
                    }else {
                        model.entries[entries.length - 1] = {
                            'id': date,
                            'createdOn': date,
                            'text': options.entry,
                            'embeds': [{'type': options.embedObject.getId(),
                                       'id': '' + date,
                                       'cssClass': options.cssClass,
                                       'name': options.selectedModel.name,
                                       'snapshot': options.snapshot
                                     }]
                        };
                    }
                });

                notification.info({
                    title: "Notebook Entry created"
                });
            }
        };

        NewEntryContextual.appliesTo = function (context) {
            var domainObject = context.domainObject;

            if (domainObject) {
                if (domainObject.getModel().type === 'Notebook') {
                    // do not allow in context of a notebook
                    return false;
                } else if (domainObject.getModel().type.includes('imagery')) {
                    // do not allow in the context of an object with imagery
                    // (because of cross domain issue with snapshot)
                    return false;
                }
            }
            return true;
        };

        return NewEntryContextual;
    }
);
