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
import { v4 as uuid } from 'uuid';

export default class ExportAsJSONAction {
  constructor(openmct) {
    this.openmct = openmct;

    this.name = 'Export as JSON';
    this.key = 'export.JSON';
    this.description = '';
    this.cssClass = 'icon-export';
    this.group = 'export';
    this.priority = 1;

    this.tree = null;
    this.calls = null;
    this.idMap = null;

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
    this.calls = 0;
    this.idMap = {};

    const root = objectpath[0];
    this.root = this._copy(root);

    const rootId = this._getKeystring(this.root);
    this.tree[rootId] = this.root;

    this._write(this.root);
  }

  /**
   * @private
   * @param {object} parent
   */
  async _write(parent) {
    this.calls++;

    //conditional object styles are not saved on the composition, so we need to check for them
    const conditionSetIdentifier = this._getConditionSetIdentifier(parent);
    const hasItemConditionSetIdentifiers = this._hasItemConditionSetIdentifiers(parent);
    const composition = this.openmct.composition.get(parent);

    if (composition) {
      const children = await composition.load();

      children.forEach((child) => {
        this._exportObject(child, parent);
      });
    }

    if (!conditionSetIdentifier && !hasItemConditionSetIdentifiers) {
      this._decrementCallsAndSave();
    } else {
      const conditionSetObjects = [];

      // conditionSetIdentifiers directly in objectStyles object
      if (conditionSetIdentifier) {
        conditionSetObjects.push(await this.openmct.objects.get(conditionSetIdentifier));
      }

      // conditionSetIdentifiers stored on item ids in the objectStyles object
      if (hasItemConditionSetIdentifiers) {
        const itemConditionSetIdentifiers = this._getItemConditionSetIdentifiers(parent);

        for (const itemConditionSetIdentifier of itemConditionSetIdentifiers) {
          conditionSetObjects.push(await this.openmct.objects.get(itemConditionSetIdentifier));
        }
      }

      for (const conditionSetObject of conditionSetObjects) {
        this._exportObject(conditionSetObject, parent);
      }

      this._decrementCallsAndSave();
    }
  }

  _exportObject(child, parent) {
    const originalKeyString = this._getKeystring(child);
    const createable = this._isCreatableAndPersistable(child);
    const isNotInfinite = !Object.prototype.hasOwnProperty.call(this.tree, originalKeyString);

    if (createable && isNotInfinite) {
      // for external or linked objects we generate new keys, if they don't exist already
      if (this._isLinkedObject(child, parent)) {
        child = this._rewriteLink(child, parent);
      } else {
        this.tree[originalKeyString] = child;
      }

      this._write(child);
    }
  }

  /**
   * @private
   * @param {object} child
   * @param {object} parent
   * @returns {object}
   */
  _rewriteLink(child, parent) {
    const originalKeyString = this._getKeystring(child);
    const parentKeyString = this._getKeystring(parent);
    const conditionSetIdentifier = this._getConditionSetIdentifier(parent);
    const hasItemConditionSetIdentifiers = this._hasItemConditionSetIdentifiers(parent);
    const existingMappedKeyString = this.idMap[originalKeyString];
    let copy;

    if (!existingMappedKeyString) {
      copy = this._copy(child);
      copy.identifier.key = uuid();

      if (!conditionSetIdentifier && !hasItemConditionSetIdentifiers) {
        copy.location = parentKeyString;
      }

      let newKeyString = this._getKeystring(copy);
      this.idMap[originalKeyString] = newKeyString;
      this.tree[newKeyString] = copy;
    } else {
      copy = this.tree[existingMappedKeyString];
    }

    if (conditionSetIdentifier || hasItemConditionSetIdentifiers) {
      // update objectStyle object
      if (conditionSetIdentifier) {
        const directObjectStylesIdentifier = this.openmct.objects.areIdsEqual(
          parent.configuration.objectStyles.conditionSetIdentifier,
          child.identifier
        );

        if (directObjectStylesIdentifier) {
          parent.configuration.objectStyles.conditionSetIdentifier = copy.identifier;
          this.tree[parentKeyString].configuration.objectStyles.conditionSetIdentifier =
            copy.identifier;
        }
      }

      // update per item id on objectStyle object
      if (hasItemConditionSetIdentifiers) {
        for (const itemId in parent.configuration.objectStyles) {
          if (parent.configuration.objectStyles[itemId]) {
            const itemConditionSetIdentifier =
              parent.configuration.objectStyles[itemId].conditionSetIdentifier;

            if (
              itemConditionSetIdentifier &&
              this.openmct.objects.areIdsEqual(itemConditionSetIdentifier, child.identifier)
            ) {
              parent.configuration.objectStyles[itemId].conditionSetIdentifier = copy.identifier;
              this.tree[parentKeyString].configuration.objectStyles[itemId].conditionSetIdentifier =
                copy.identifier;
            }
          }
        }
      }
    } else {
      // just update parent
      const index = parent.composition.findIndex((identifier) => {
        return this.openmct.objects.areIdsEqual(child.identifier, identifier);
      });

      parent.composition[index] = copy.identifier;
      this.tree[parentKeyString].composition[index] = copy.identifier;
    }

    return copy;
  }

  /**
   * @private
   * @param {object} domainObject
   * @returns {string} A string representation of the given identifier, including namespace and key
   */
  _getKeystring(domainObject) {
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
    const rootKeyString = this._getKeystring(this.root);
    const childKeyString = this._getKeystring(child);
    const parentKeyString = this._getKeystring(parent);

    return (
      (child.location !== parentKeyString &&
        !Object.keys(this.tree).includes(child.location) &&
        childKeyString !== rootKeyString) ||
      this.idMap[childKeyString] !== undefined
    );
  }

  _getConditionSetIdentifier(object) {
    return object.configuration?.objectStyles?.conditionSetIdentifier;
  }

  _hasItemConditionSetIdentifiers(parent) {
    const objectStyles = parent.configuration?.objectStyles;

    for (const itemId in objectStyles) {
      if (Object.prototype.hasOwnProperty.call(objectStyles[itemId], 'conditionSetIdentifier')) {
        return true;
      }
    }

    return false;
  }

  _getItemConditionSetIdentifiers(parent) {
    const objectStyles = parent.configuration?.objectStyles;
    let identifiers = new Set();

    if (objectStyles) {
      Object.keys(objectStyles).forEach((itemId) => {
        if (objectStyles[itemId].conditionSetIdentifier) {
          identifiers.add(objectStyles[itemId].conditionSetIdentifier);
        }
      });
    }

    return Array.from(identifiers);
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
    this.JSONExportService.export(completedTree, { filename: this.root.name + '.json' });
  }
  /**
   * @private
   * @returns {object}
   */
  _wrapTree() {
    return {
      openmct: this.tree,
      rootId: this._getKeystring(this.root)
    };
  }

  _decrementCallsAndSave() {
    this.calls--;
    if (this.calls === 0) {
      this._rewriteReferences();
      this._saveAs(this._wrapTree());
    }
  }

  _copy(object) {
    return JSON.parse(JSON.stringify(object));
  }
}
