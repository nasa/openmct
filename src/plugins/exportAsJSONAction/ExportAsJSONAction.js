/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
import { v4 as uuid } from 'uuid';

import JSONExporter from '/src/exporters/JSONExporter.js';

export default class ExportAsJSONAction {
  #openmct;

  /**
   * @param {import('../../../openmct').OpenMCT} openmct The Open MCT API
   */
  constructor(openmct) {
    this.#openmct = openmct;

    // Bind public methods
    this.invoke = this.invoke.bind(this);
    this.appliesTo = this.appliesTo.bind(this);
    // FIXME: This should be private but is used in tests
    this.saveAs = this.saveAs.bind(this);

    this.name = 'Export as JSON';
    this.key = 'export.JSON';
    this.description = '';
    this.cssClass = 'icon-export';
    this.group = 'export';
    this.priority = 1;

    this.tree = null;
    this.calls = null;
    this.idMap = null;
    this.dialog = null;
    this.progressPerc = 0;
    this.exportedCount = 0;
    this.totalToExport = 0;

    this.JSONExportService = new JSONExporter();
  }

  // Public
  /**
   *
   * @param {Object} objectPath
   * @returns {boolean}
   */
  appliesTo(objectPath) {
    let domainObject = objectPath[0];

    return this.#isCreatableAndPersistable(domainObject);
  }
  /**
   *
   * @param {import('../../api/objects/ObjectAPI').DomainObject[]} objectPath
   */
  invoke(objectPath) {
    this.tree = {};
    this.calls = 0;
    this.idMap = {};

    const root = objectPath[0];
    this.root = this.#copy(root);

    const rootId = this.#getKeystring(this.root);
    this.tree[rootId] = this.root;

    this.dialog = this.#openmct.overlays.progressDialog({
      message:
        'Do not navigate away from this page or close this browser tab while this message is displayed.',
      iconClass: 'info',
      title: 'Exporting'
    });
    this.dialog.show();
    this.#write(this.root)
      .then(() => {
        this.exportedCount++;
        this.#updateProgress();
      })
      .catch((error) => {
        this.dialog.dismiss();
        this.dialog = null;
        this.#resetCounts();
        this.#openmct.notifications.error({
          title: 'Export as JSON failed',
          message: error.message
        });
      });
  }

  /**
   * @private
   * @param {import('../../api/objects/ObjectAPI').DomainObject} parent
   */
  async #write(parent) {
    this.totalToExport++;
    this.calls++;

    //conditional object styles are not saved on the composition, so we need to check for them
    const conditionSetIdentifier = this.#getConditionSetIdentifier(parent);
    const hasItemConditionSetIdentifiers = this.#hasItemConditionSetIdentifiers(parent);
    const composition = this.#openmct.composition.get(parent);

    if (composition) {
      const children = await composition.load();
      const exportPromises = children.map((child) => this.#exportObject(child, parent));

      await Promise.all(exportPromises);
    }

    if (!conditionSetIdentifier && !hasItemConditionSetIdentifiers) {
      this.#decrementCallsAndSave();
    } else {
      let conditionSetObjects = [];

      // conditionSetIdentifiers directly in objectStyles object
      if (conditionSetIdentifier) {
        const conditionSetObject = this.#openmct.objects.get(conditionSetIdentifier);
        conditionSetObjects.push(conditionSetObject);
      }

      // conditionSetIdentifiers stored on item ids in the objectStyles object
      if (hasItemConditionSetIdentifiers) {
        const itemConditionSetIdentifiers = this.#getItemConditionSetIdentifiers(parent);
        const itemConditionSetObjects = itemConditionSetIdentifiers.map((id) =>
          this.#openmct.objects.get(id)
        );
        conditionSetObjects = conditionSetObjects.concat(itemConditionSetObjects);

        for (const itemConditionSetIdentifier of itemConditionSetIdentifiers) {
          conditionSetObjects.push(this.#openmct.objects.get(itemConditionSetIdentifier));
        }
      }

      if (conditionSetObjects.length > 0) {
        const resolvedConditionSetObjects = await Promise.all(conditionSetObjects);
        const exportConditionSetPromises = resolvedConditionSetObjects.map((obj) =>
          this.#exportObject(obj, parent)
        );
        await Promise.all(exportConditionSetPromises);
      }

      this.#decrementCallsAndSave();
    }
  }

  #updateProgress() {
    this.progressPerc = Math.ceil((100 * this.exportedCount) / this.totalToExport);
    this.dialog?.updateProgress(
      this.progressPerc,
      `Exporting ${this.exportedCount} / ${this.totalToExport} objects.`
    );
  }

  #exportObject(child, parent) {
    const originalKeyString = this.#getKeystring(child);
    const createable = this.#isCreatableAndPersistable(child);
    const isNotInfinite = !Object.prototype.hasOwnProperty.call(this.tree, originalKeyString);

    if (createable && isNotInfinite) {
      // for external or linked objects we generate new keys, if they don't exist already
      if (this.#isLinkedObject(child, parent)) {
        child = this.#rewriteLink(child, parent);
      } else {
        this.tree[originalKeyString] = child;
      }

      this.#write(child).then(() => {
        this.exportedCount++;
        this.#updateProgress();
      });
    }
  }

  /**
   * @private
   * @param {Object} child
   * @param {Object} parent
   * @returns {Object}
   */
  #rewriteLink(child, parent) {
    const originalKeyString = this.#getKeystring(child);
    const parentKeyString = this.#getKeystring(parent);
    const conditionSetIdentifier = this.#getConditionSetIdentifier(parent);
    const hasItemConditionSetIdentifiers = this.#hasItemConditionSetIdentifiers(parent);
    const existingMappedKeyString = this.idMap[originalKeyString];
    let copy;

    if (!existingMappedKeyString) {
      copy = this.#copy(child);
      copy.identifier.key = uuid();

      if (!conditionSetIdentifier && !hasItemConditionSetIdentifiers) {
        copy.location = parentKeyString;
      }

      let newKeyString = this.#getKeystring(copy);
      this.idMap[originalKeyString] = newKeyString;
      this.tree[newKeyString] = copy;
    } else {
      copy = this.tree[existingMappedKeyString];
    }

    if (conditionSetIdentifier || hasItemConditionSetIdentifiers) {
      // update objectStyle object
      if (conditionSetIdentifier) {
        const directObjectStylesIdentifier = this.#openmct.objects.areIdsEqual(
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
              this.#openmct.objects.areIdsEqual(itemConditionSetIdentifier, child.identifier)
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
        return this.#openmct.objects.areIdsEqual(child.identifier, identifier);
      });

      parent.composition[index] = copy.identifier;
      this.tree[parentKeyString].composition[index] = copy.identifier;
    }

    return copy;
  }

  /**
   * @private
   * @param {Object} domainObject
   * @returns {string} A string representation of the given identifier, including namespace and key
   */
  #getKeystring(domainObject) {
    return this.#openmct.objects.makeKeyString(domainObject.identifier);
  }

  /**
   * @private
   * @param {Object} domainObject
   * @returns {boolean}
   */
  #isCreatableAndPersistable(domainObject) {
    const type = this.#openmct.types.get(domainObject.type);
    const isPersistable = this.#openmct.objects.isPersistable(domainObject.identifier);

    return type && type.definition.creatable && isPersistable;
  }

  /**
   * @private
   * @param {Object} child
   * @param {Object} parent
   * @returns {boolean}
   */
  #isLinkedObject(child, parent) {
    const rootKeyString = this.#getKeystring(this.root);
    const childKeyString = this.#getKeystring(child);
    const parentKeyString = this.#getKeystring(parent);

    return (
      (child.location !== parentKeyString &&
        !Object.keys(this.tree).includes(child.location) &&
        childKeyString !== rootKeyString) ||
      this.idMap[childKeyString] !== undefined
    );
  }

  #getConditionSetIdentifier(object) {
    return object.configuration?.objectStyles?.conditionSetIdentifier;
  }

  #hasItemConditionSetIdentifiers(parent) {
    const objectStyles = parent.configuration?.objectStyles;

    for (const itemId in objectStyles) {
      if (Object.prototype.hasOwnProperty.call(objectStyles[itemId], 'conditionSetIdentifier')) {
        return true;
      }
    }

    return false;
  }

  #getItemConditionSetIdentifiers(parent) {
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

  #resetCounts() {
    this.totalToExport = 0;
    this.exportedCount = 0;
  }

  /**
   * @private
   */
  #rewriteReferences() {
    const oldKeyStrings = Object.keys(this.idMap);
    let treeString = JSON.stringify(this.tree);

    oldKeyStrings.forEach((oldKeyString) => {
      // this will cover keyStrings, identifiers and identifiers created
      // by hand that may be structured differently from those created with 'makeKeyString'
      const newKeyString = this.idMap[oldKeyString];
      const newIdentifier = JSON.stringify(this.#openmct.objects.parseKeyString(newKeyString));
      const oldIdentifier = this.#openmct.objects.parseKeyString(oldKeyString);
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
   * @param {Object} completedTree
   */
  saveAs(completedTree) {
    this.JSONExportService.export(completedTree, { filename: this.root.name + '.json' });
  }
  /**
   * @private
   * @returns {Object}
   */
  #wrapTree() {
    return {
      openmct: this.tree,
      rootId: this.#getKeystring(this.root)
    };
  }

  #decrementCallsAndSave() {
    this.calls--;
    this.#updateProgress();
    if (this.calls === 0) {
      this.#rewriteReferences();
      this.dialog.dismiss();

      this.#resetCounts();
      this.saveAs(this.#wrapTree());

      this.dialog = null;
    }
  }

  #copy(object) {
    return JSON.parse(JSON.stringify(object));
  }
}
