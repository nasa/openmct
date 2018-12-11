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

function generateTaskForm(url) {
    var taskForm = {
        name: "Create a Notebook Entry",
        hint: "Please select a Notebook",
        sections: [{
            rows: [
                {
                    name: 'Entry',
                    key: 'entry',
                    control: 'textarea',
                    required: false,
                    cssClass: "l-textarea-sm"
                },
                {
                    name: 'Snap Preview',
                    key:"snapPreview",
                    control: "snap-view",
                    cssClass: "l-textarea-sm",
                    src: url
                },
                {
                    name: 'Save in Notebook',
                    key: 'notebook',
                    control: 'locator',
                    validate: validateLocation
                }
            ]
        }]
    };

    var overlayModel = {
        title: taskForm.name,
        message: 'Notebook Snapshot',
        structure: taskForm,
        value: {'entry': ""}
    };

    function validateLocation(newParentObj) {
        return newParentObj.model.type === 'notebook';
    }

    return overlayModel;
}

function saveSnapShot(dialogService, imageUrl, imageType, imageSize, embedObject) {
    let taskForm = generateTaskForm(imageUrl);

    dialogService.getDialogResponse(
        'overlay-dialog',
        taskForm,
        () => taskForm.value
    ).then(options => {
        let snapshotObject = {
            src: options.snapPreview || imageUrl,
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
                    name: embedObject.name,
                    cssClass: embedObject.cssClass,
                    type: embedObject.id,
                    id: 'embed-' + date,
                    createdOn: date,
                    snapshot: snapshotObject
                }]
            });
        });
    });
}

export default {
    inject: ['openmct', 'domainObject'],
    methods: {
        takeSnapshot(DOMElement) {
            let exportImageService = this.openmct.$injector.get('exportImageService'),
                dialogService = this.openmct.$injector.get('dialogService');

            let type = this.openmct.types.get(this.domainObject.type),
                embedObject = {
                    id: this.domainObject.identifier.key,
                    cssClass: type.cssClass,
                    name: this.domainObject.name
                };

            DOMElement.classList.add('s-status-taking-snapshot');

            exportImageService.exportPNGtoSRC(DOMElement).then(function (blob) {
                DOMElement.classList.remove('s-status-taking-snapshot');

                if (blob) {
                    var reader = new window.FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function () {
                        saveSnapShot(dialogService, reader.result, blob.type, blob.size, embedObject);
                    };
                }
            });
        }
    }
};
