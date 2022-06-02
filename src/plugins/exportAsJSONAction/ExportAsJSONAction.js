/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
import JSONExporter from '/src/exporters/JSONExporter.js';

import _ from 'lodash';
import { v4 as uuid } from 'uuid';

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

        this.JSONExportService = new JSONExporter();
    }

    // Public
    /**
     *
     * @param {object} objectPath
     * @returns {boolean}
     */
    appliesTo(objectPath) {
        let domainObject = objectPath[0];

        return this._isCreatableAndPersistable(domainObject);
    }
    /**
     *
     * @param {object} objectpath
     */
    invoke(objectpath) {
        this.tree = {};
        const root = objectpath[0];
        this.root = JSON.parse(JSON.stringify(root));
        const rootId = this._getId(this.root);
        this.tree[rootId] = this.root;

        this._write(this.root);
    }
    /**
     * @private
     * @param {object} domainObject
     * @returns {string} A string representation of the given identifier, including namespace and key
     */
    _getId(domainObject) {
        return this.openmct.objects.makeKeyString(domainObject.identifier);
    }
    /**
     * @private
     * @param {object} domainObject
     * @returns {boolean}
     */
    _isCreatableAndPersistable(domainObject) {
        const type = this.openmct.types.get(domainObject.type);
        const isPersistable = this.openmct.objects.isPersistable(domainObject.identifier);

        return type && type.definition.creatable && isPersistable;
    }
    /**
     * @private
     * @param {object} child
     * @param {object} parent
     * @returns {boolean}
     */
    _isLinkedObject(child, parent) {
        if (child.location !== this._getId(parent)
            && !Object.keys(this.tree).includes(child.location)
            && this._getId(child) !== this._getId(this.root)
            || this.externalIdentifiers.includes(this._getId(child))) {

            return true;
        }

        return false;
    }
    /**
     * @private
     * @param {object} child
     * @param {object} parent
     * @returns {object}
     */
    _rewriteLink(child, parent) {
        this.externalIdentifiers.push(this._getId(child));
        const index = parent.composition.findIndex(id => {
            return _.isEqual(child.identifier, id);
        });
        const copyOfChild = JSON.parse(JSON.stringify(child));

        copyOfChild.identifier.key = uuid();
        const newIdString = this._getId(copyOfChild);
        const parentId = this._getId(parent);

        this.idMap[this._getId(child)] = newIdString;
        copyOfChild.location = parentId;
        parent.composition[index] = copyOfChild.identifier;
        this.tree[newIdString] = copyOfChild;
        this.tree[parentId].composition[index] = copyOfChild.identifier;

        return copyOfChild;
    }
    /**
     * @private
     */
    _rewriteReferences() {
        let treeString = JSON.stringify(this.tree);
        Object.keys(this.idMap).forEach(function (oldId) {
            const newId = this.idMap[oldId];
            treeString = treeString.split(oldId).join(newId);
        }.bind(this));
        this.tree = JSON.parse(treeString);
    }
    /**
     * @private
     * @param {object} completedTree
     */
    _saveAs(completedTree) {
        this.JSONExportService.export(
            completedTree,
            { filename: this.root.name + '.json' }
        );
    }
    /**
     * @private
     * @returns {object}
     */
    _wrapTree() {
        return {
            "openmct": this.tree,
            "rootId": this._getId(this.root)
        };
    }
    /**
     * @private
     * @param {object} parent
     */
    _write(parent) {
        this.calls++;
        const composition = this.openmct.composition.get(parent);
        if (composition !== undefined) {
            composition.load()
                .then((children) => {
                    children.forEach((child, index) => {
                        // Only export if object is creatable
                        if (this._isCreatableAndPersistable(child)) {
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
