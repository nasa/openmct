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
define(
    ['zepto'],
    function ($) {

        function SnapshotAction (exportImageService, dialogService, context) {
            this.exportImageService = exportImageService;
            this.dialogService = dialogService;
            this.domainObject = context.domainObject;
        }

        SnapshotAction.prototype.perform = function () {
            var elementToSnapshot =
                $(document.body).find(".overlay .object-holder")[0] ||
                $(document.body).find("[key='representation.selected.key']")[0];

            $(elementToSnapshot).addClass("s-status-taking-snapshot");

            this.exportImageService.exportPNGtoSRC(elementToSnapshot).then(function (blob) {
                $(elementToSnapshot).removeClass("s-status-taking-snapshot");

                if (blob) {
                    var reader = new window.FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function () {
                        this.saveSnapshot(reader.result, blob.type, blob.size);
                    }.bind(this);
                }

            }.bind(this));
        };

        SnapshotAction.prototype.saveSnapshot = function (imageURL, imageType, imageSize) {
            var taskForm = this.generateTaskForm(),
                domainObject = this.domainObject,
                domainObjectId = domainObject.getId(),
                cssClass = domainObject.getCapability('type').typeDef.cssClass,
                name = domainObject.model.name;

            this.dialogService.getDialogResponse(
                'overlay-dialog',
                taskForm,
                function () {
                    return taskForm.value;
                }
            ).then(function (options) {
                var snapshotObject = {
                    src: imageURL,
                    type: imageType,
                    size: imageSize
                };

                options.notebook.useCapability('mutation', function (model) {
                    var date = Date.now();

                    model.entries.push({
                        id: 'entry-' + date,
                        createdOn: date,
                        text: options.entry,
                        embeds: [{
                            name: name,
                            cssClass: cssClass,
                            type: domainObjectId,
                            id: 'embed-' + date,
                            createdOn: date,
                            snapshot: snapshotObject
                        }]
                    });
                });
            });
        };

        SnapshotAction.prototype.generateTaskForm = function () {
            var taskForm = {
                name: "Create a Notebook Entry",
                hint: "Please select a Notebook",
                sections: [{
                    rows: [{
                        name: 'Entry',
                        key: 'entry',
                        control: 'textarea',
                        required: false,
                        "cssClass": "l-textarea-sm"
                    },
                    {
                        name: 'Save in Notebook',
                        key: 'notebook',
                        control: 'locator',
                        validate: validateLocation
                    }]
                }]
            };

            var overlayModel = {
                title: taskForm.name,
                message: 'AHAHAH',
                structure: taskForm,
                value: {'entry': ""}
            };

            function validateLocation(newParentObj) {
                return newParentObj.model.type === 'notebook';
            }

            return overlayModel;
        };

        return SnapshotAction;
    }
);
