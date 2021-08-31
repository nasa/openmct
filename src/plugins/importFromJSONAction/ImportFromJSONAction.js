/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import objectUtils from 'objectUtils';
import uuid from "uuid";

export default class ImportAsJSONAction {
    constructor(openmct) {
        this.name = 'Import from JSON';
        this.key = 'import.JSON';
        this.description = '';
        this.cssClass = "icon-import";
        this.group = "json";
        this.priority = 2;

        this.openmct = openmct;
    }

    // Public

    appliesTo(objectPath) {
        const domainObject = objectPath[0];
        if (domainObject && domainObject.locked) {
            return false;
        }

        return domainObject !== undefined
            && this.openmct.composition.get(domainObject);
    }

    invoke(objectPath) {
        this._showForm(objectPath[0], objectPath[1]);
    }

    onSave(object, changes, parent) {
        const selectFile = changes.selectFile;
        const objectTree = selectFile.body;
        this._importObjectTree(object, JSON.parse(objectTree));
    }

    // Private

    _deepInstantiate(parent, tree, seen) {
        if (this.openmct.composition.get(parent)) {
            let newObj;

            seen.push(parent.id);

            parent.composition.forEach(async (childId) => {
                const keystring = this.openmct.objects.makeKeyString(childId);
                if (!tree[keystring] || seen.includes(keystring)) {
                    return;
                }

                const newModel = tree[keystring];
                delete newModel.persisted;

                newObj = await this._instantiate(newModel);
                this._deepInstantiate(newObj, tree, seen);
            }, this);
        }
    }

    _generateNewIdentifiers(tree, namespace) {
        // For each domain object in the file, generate new ID, replace in tree
        Object.keys(tree.openmct).forEach(domainObjectId => {
            const newId = {
                namespace,
                key: uuid()
            };

            const oldId = objectUtils.parseKeyString(domainObjectId);

            tree = this._rewriteId(oldId, newId, tree);
        }, this);

        return tree;
    }

    async _importObjectTree(domainObject, objTree) {
        const namespace = domainObject.identifier.namespace;
        const tree = this._generateNewIdentifiers(objTree, namespace);
        const rootId = tree.rootId;

        const rootModel = tree.openmct[rootId];
        delete rootModel.persisted;

        const rootObj = await this._instantiate(rootModel);
        if (this.openmct.composition.checkPolicy(domainObject, rootObj)) {
            this._deepInstantiate(rootObj, tree.openmct, []);

            const compositionCollection = this.openmct.composition.get(domainObject);
            let domainObjectKeyString = this.openmct.objects.makeKeyString(domainObject.identifier);
            this.openmct.objects.mutate(rootObj, 'location', domainObjectKeyString);
            compositionCollection.add(rootObj);
        } else {
            const dialog = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: "We're sorry, but you cannot import that object type into this object.",
                buttons: [
                    {
                        label: "Ok",
                        emphasis: true,
                        callback: function () {
                            dialog.dismiss();
                        }
                    }
                ]
            });
        }
    }

    async _instantiate(rootModel) {
        const success = await this.openmct.objects.save(rootModel);
        if (success) {
            return rootModel;
        }

        this.openmct.notifications.error('Error saving objects');
    }

    _rewriteId(oldId, newId, tree) {
        let newIdKeyString = this.openmct.objects.makeKeyString(newId);
        let oldIdKeyString = this.openmct.objects.makeKeyString(oldId);
        tree = JSON.stringify(tree).replace(new RegExp(oldIdKeyString, 'g'), newIdKeyString);

        return JSON.parse(tree, (key, value) => {
            if (value !== undefined
                && value !== null
                && Object.prototype.hasOwnProperty.call(value, 'key')
                && Object.prototype.hasOwnProperty.call(value, 'namespace')
                && value.key === oldId.key
                && value.namespace === oldId.namespace) {
                return newId;
            } else {
                return value;
            }
        });
    }

    _showForm(domainObject, parentDomainObject) {
        const formStructure = {
            title: this.name,
            sections: [
                {
                    rows: [
                        {
                            name: 'Select File',
                            key: 'selectFile',
                            control: 'file-input',
                            required: true,
                            text: 'Select File...',
                            validate: this._validateJSON,
                            type: 'application/json'
                        }
                    ]
                }
            ]
        };

        this.openmct.forms.showForm(formStructure, {
            domainObject,
            parentDomainObject,
            onSave: this.onSave.bind(this)
        });
    }

    _validateJSON(domainObject, data) {
        const value = data.value;
        const objectTree = value && value.body;
        let json;
        let success = true;
        try {
            json = JSON.parse(objectTree);
        } catch (e) {
            success = false;
        }

        if (success && (!json.openmct || !json.rootId)) {
            success = false;
        }

        if (!success) {
            this.openmct.notifications.error('Invalid File: The selected file was either invalid JSON or was not formatted properly for import into Open MCT.');
        }

        return success;
    }
}
