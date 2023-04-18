/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
        this.group = "export";
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
        this.externalIdentifiers = [];
        this.tree = {};
        this.calls = 0;
        this.idMap = {};

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
    _rewriteLink(child, parent, isReference) {
        const originalKeyString = this._getId(child);
        const parentKeyString = this._getId(parent);
        const existingMappedKeyString = this.idMap[originalKeyString];
        let copy;

        if (!existingMappedKeyString) {
            this.externalIdentifiers.push(originalKeyString);

            copy = JSON.parse(JSON.stringify(child));
            copy.identifier.key = uuid();
            copy.location = isReference ? null : parentKeyString;

            let newKeyString = this._getId(copy);
            this.idMap[originalKeyString] = newKeyString;
            this.tree[newKeyString] = copy;
        } else {
            copy = this.tree[existingMappedKeyString];
        }

        if (isReference) {
            parent.configuration.objectStyles.conditionSetIdentifier = copy.identifier;
            this.tree[parentKeyString].configuration.objectStyles.conditionSetIdentifier = copy.identifier;
        } else {
            const index = parent.composition.findIndex(identifier => {
                return this.openmct.objects.areIdsEqual(child.identifier, identifier);
            });

            parent.composition[index] = copy.identifier;
            this.tree[parentKeyString].composition[index] = copy.identifier;
        }

        return copy;
    }

    /**
     * @private
     */
    _rewriteReferences() {
        const oldKeyStrings = Object.keys(this.idMap);
        let treeString = JSON.stringify(this.tree);

        oldKeyStrings.forEach((oldKeyString) => {
            // this will cover keyStrings, identifiers and identifiers created
            // by hand that may be structured differently from those created with 'makeKeyString'
            const newKeyString = this.idMap[oldKeyString];
            const newIdentifier = JSON.stringify(this.openmct.objects.parseKeyString(newKeyString));
            const oldIdentifier = this.openmct.objects.parseKeyString(oldKeyString);
            const oldIdentifierNamespaceFirst = JSON.stringify(oldIdentifier);
            const oldIdentifierKeyFirst = JSON.stringify({
                key: oldIdentifier.key,
                namespace: oldIdentifier.namespace
            });

            // replace keyStrings
            treeString = treeString.split(oldKeyString).join(newKeyString);

            // check for namespace first identifiers, replace if necessary
            if (treeString.includes(oldIdentifierNamespaceFirst)) {
                treeString = treeString.split(oldIdentifierNamespaceFirst).join(newIdentifier);
            }

            // check for key first identifiers, replace if necessary
            if (treeString.includes(oldIdentifierKeyFirst)) {
                treeString = treeString.split(oldIdentifierKeyFirst).join(newIdentifier);
            }

        });
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
    async _write(parent) {
        this.calls++;

        //conditional object styles are not saved on the composition, so we need to check for them
        const childObjectReferenceId = parent.configuration?.objectStyles?.conditionSetIdentifier;
        const composition = this.openmct.composition.get(parent);

        if (composition !== undefined) {
            const children = await composition.load();

            children.forEach((child) => {
                this._exportObject(child, parent, childObjectReferenceId);
            });

            if (!childObjectReferenceId) {
                this._decrementCallsAndSave();
            }
        } else if (!childObjectReferenceId) {
            this._decrementCallsAndSave();
        }

        if (childObjectReferenceId) {
            const child = await this.openmct.objects.get(childObjectReferenceId);

            this._exportObject(child, parent, childObjectReferenceId);
            this._decrementCallsAndSave();
        }
    }

    _exportObject(child, parent, isReference) {
        const originalKeyString = this._getId(child);

        // Only export if object is creatable
        if (this._isCreatableAndPersistable(child)) {
            // Prevents infinite export of self-contained objs
            if (!Object.prototype.hasOwnProperty.call(this.tree, originalKeyString)) {
                // If object is a link to something absent from tree, generate new id and treat as new object
                if (this._isLinkedObject(child, parent)) {
                    child = this._rewriteLink(child, parent, isReference);
                } else {
                    this.tree[originalKeyString] = child;
                }

                this._write(child);
            }
        }
    }

    _decrementCallsAndSave() {
        this.calls--;
        if (this.calls === 0) {
            this._rewriteReferences();
            this._saveAs(this._wrapTree());
        }
    }
}
