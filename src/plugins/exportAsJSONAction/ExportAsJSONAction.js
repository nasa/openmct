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
import ExportService from '../../../platform/exporters/ExportService.js';

import _ from 'lodash';
import { saveAs } from 'saveAs';

export default class ExportAsJSONAction {
    constructor(openmct) {
        this.openmct = openmct;

        this.name = 'Export as JSON';
        this.key = 'export.JSON';
        this.description = '';
        this.cssClass = "icon-export";
        this.group = "json";
        this.priority = 1;

        this.externalIdentifiers = [];
        this.tree = {};
        this.calls = 0;
        this.idMap = {};

        this.exportService = new ExportService(saveAs);
    }

    // Public
    appliesTo(objectPath) {
        let domainObject = objectPath[0];

        return this._isCreatable(domainObject);
    }

    invoke(objectpath) {
        const root = objectpath[0];
        this.root = JSON.parse(JSON.stringify(root));
        const rootId = this._getId(this.root);
        this.tree[rootId] = this.root;

        this._write(this.root);
    }

    // Private

    _getId(domainObject) {
        return this.openmct.objects.makeKeyString(domainObject.identifier);
    }

    _isCreatable(domainObject) {
        const type = this.openmct.types.get(domainObject.type);

        return type && type.definition.creatable;
    }

    _isLinkedObject(child, parent) {
        if (child.location !== this._getId(parent)
            && !Object.keys(this.tree).includes(child.location)
            && this._getId(child) !== this._getId(this.root)
            || this.externalIdentifiers.includes(this._getId(child))) {

            return true;
        }

        return false;
    }

    _rewriteLink(child, parent) {
        this.externalIdentifiers.push(this._getId(child));
        const index = parent.composition.findIndex(id => {
            return _.isEqual(child.identifier, id);
        });
        const copyOfChild = JSON.parse(JSON.stringify(child));
        copyOfChild.identifier.key = this.identifierService.generate();
        const newIdString = this._getId(copyOfChild);
        const parentId = this._getId(parent);

        this.idMap[this._getId(child)] = newIdString;
        copyOfChild.location = parentId;
        parent.composition[index] = copyOfChild.identifier;
        this.tree[newIdString] = copyOfChild;
        this.tree[parentId].composition[index] = copyOfChild.identifier;

        return copyOfChild;
    }

    _rewriteReferences() {
        let treeString = JSON.stringify(this.tree);
        Object.keys(this.idMap).forEach(function (oldId) {
            const newId = this.idMap[oldId];
            treeString = treeString.split(oldId).join(newId);
        }.bind(this));
        this.tree = JSON.parse(treeString);
    }

    _saveAs(completedTree) {
        this.exportService.exportJSON(
            completedTree,
            { filename: this.root.name + '.json' }
        );
    }

    _wrapTree() {
        return {
            "openmct": this.tree,
            "rootId": this._getId(this.root)
        };
    }

    _write(parent) {
        this.calls++;
        const composition = this.openmct.composition.get(parent);
        if (composition !== undefined) {
            composition.load()
                .then((children) => {
                    children.forEach((child, index) => {
                        // Only export if object is creatable
                        if (this._isCreatable(child)) {
                            // Prevents infinite export of self-contained objs
                            if (!Object.prototype.hasOwnProperty.call(this.tree, this._getId(child))) {
                                // If object is a link to something absent from
                                // tree, generate new id and treat as new object
                                if (this._isLinkedObject(child, parent)) {
                                    child = this._rewriteLink(child, parent);
                                } else {
                                    this.tree[this._getId(child)] = child;
                                }

                                this._write(child);
                            }
                        }
                    });
                    this.calls--;
                    if (this.calls === 0) {
                        this._rewriteReferences();
                        this._saveAs(this._wrapTree());
                    }
                });
        } else {
            this.calls--;
            if (this.calls === 0) {
                this._rewriteReferences();
                this._saveAs(this._wrapTree());
            }
        }
    }
}
