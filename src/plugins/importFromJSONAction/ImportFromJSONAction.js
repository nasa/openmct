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

import { parseKeyString } from 'objectUtils';
import { filter__proto__ } from 'utils/sanitization';
import { v4 as uuid } from 'uuid';

export default class ImportAsJSONAction {
  constructor(openmct) {
    this.name = 'Import from JSON';
    this.key = 'import.JSON';
    this.description = '';
    this.cssClass = 'icon-import';
    this.group = 'import';
    this.priority = 2;

    this.openmct = openmct;
  }

  // Public
  /**
   *
   * @param {Object} objectPath
   * @returns {boolean}
   */
  appliesTo(objectPath) {
    const domainObject = objectPath[0];
    const locked = domainObject && domainObject.locked;
    const persistable = this.openmct.objects.isPersistable(domainObject.identifier);
    const TypeDefinition = this.openmct.types.get(domainObject.type);
    const definition = TypeDefinition.definition;
    const creatable = definition && definition.creatable;

    if (locked || !persistable || !creatable) {
      return false;
    }

    return domainObject !== undefined && this.openmct.composition.get(domainObject);
  }
  /**
   *
   * @param {Object} objectPath
   */
  invoke(objectPath) {
    this._showForm(objectPath[0]);
  }
  /**
   *
   * @param {Object} object
   * @param {Object} changes
   */

  onSave(object, changes) {
    const selectFile = changes.selectFile;
    const jsonTree = selectFile.body;
    const objectTree = JSON.parse(jsonTree, filter__proto__);

    this._importObjectTree(object, objectTree);
  }

  /**
   * @private
   * @param {Object} parent
   * @param {Object} tree
   * @param {Object} seen
   * @param {Array} objectsToCreate tracks objects from import json that will need to be created
   */
  _deepInstantiate(parent, tree, seen, objectsToCreate) {
    const objectIdentifiers = this._getObjectReferenceIds(parent);

    if (objectIdentifiers.length) {
      const parentId = this.openmct.objects.makeKeyString(parent.identifier);
      seen.push(parentId);

      for (const childId of objectIdentifiers) {
        const keystring = this.openmct.objects.makeKeyString(childId);
        if (!tree[keystring] || seen.includes(keystring)) {
          continue;
        }

        const newModel = tree[keystring];
        delete newModel.persisted;

        objectsToCreate.push(newModel);

        // make sure there weren't any errors saving
        if (newModel) {
          this._deepInstantiate(newModel, tree, seen, objectsToCreate);
        }
      }
    }
  }

  /**
   * @private
   * @param {Object} parent
   * @returns [identifiers]
   */
  _getObjectReferenceIds(parent) {
    let objectIdentifiers = [];
    let itemObjectReferences = [];
    const objectStyles = parent?.configuration?.objectStyles;
    const parentComposition = this.openmct.composition.get(parent);

    if (parentComposition) {
      objectIdentifiers = Array.from(parent.composition);
    }

    //conditional object styles are not saved on the composition, so we need to check for them
    if (objectStyles) {
      const parentObjectReference = objectStyles.conditionSetIdentifier;

      if (parentObjectReference) {
        objectIdentifiers.push(parentObjectReference);
      }

      function hasConditionSetIdentifier(item) {
        return Boolean(item.conditionSetIdentifier);
      }

      itemObjectReferences = Object.values(objectStyles)
        .filter(hasConditionSetIdentifier)
        .map((item) => item.conditionSetIdentifier);
    }

    return Array.from(new Set([...objectIdentifiers, ...itemObjectReferences]));
  }

  /**
   * Generates a map of old IDs to new IDs for efficient lookup during tree walking.
   * This function considers cases where original namespaces are blank and updates those IDs as well.
   *
   * @param {Object} tree - The object tree containing the old IDs.
   * @param {string} newNamespace - The namespace for the new IDs.
   * @returns {Object} A map of old IDs to new IDs.
   */
  _generateIdMap(tree, newNamespace) {
    const idMap = {};
    const keys = Object.keys(tree.openmct);

    for (const oldIdKey of keys) {
      const oldId = parseKeyString(oldIdKey);
      const newId = {
        namespace: newNamespace,
        key: uuid()
      };
      const newIdKeyString = this.openmct.objects.makeKeyString(newId);

      // Update the map with the old and new ID key strings.
      idMap[oldIdKey] = newIdKeyString;

      // If the old namespace is blank, also map the non-namespaced ID.
      if (!oldId.namespace) {
        const nonNamespacedOldIdKey = oldId.key;
        idMap[nonNamespacedOldIdKey] = newIdKeyString;
      }
    }

    return idMap;
  }

  /**
   * Walks through the object tree and updates IDs according to the provided ID map.
   * @param {Object} obj - The current object being visited in the tree.
   * @param {Object} idMap - A map of old IDs to new IDs for rewriting.
   * @param {Object} importDialog - Optional progress dialog for import.
   * @returns {Promise<Object>} The object with updated IDs.
   */
  async _walkAndRewriteIds(obj, idMap, importDialog) {
    // How many rewrites to do before yielding to the event loop
    const UI_UPDATE_INTERVAL = 300;
    // The percentage of the progress dialog to allocate to rewriting IDs
    const PERCENT_OF_DIALOG = 80;
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      const possibleId = idMap[obj];
      if (possibleId) {
        return possibleId;
      } else {
        return obj;
      }
    }

    if (Object.hasOwn(obj, 'key') && Object.hasOwn(obj, 'namespace')) {
      const oldId = this.openmct.objects.makeKeyString(obj);
      const possibleId = idMap[oldId];

      if (possibleId) {
        const newIdParts = possibleId.split(':');
        if (newIdParts.length >= 2) {
          // new ID is namespaced, so update both the namespace and key
          obj.namespace = newIdParts[0];
          obj.key = newIdParts[1];
        } else {
          // old ID was not namespaced, so update the key only
          obj.namespace = '';
          obj.key = newIdParts[0];
        }
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = await this._walkAndRewriteIds(obj[i], idMap); // Process each item in the array
      }
      return obj;
    }

    if (typeof obj === 'object') {
      const newObj = {};

      const keys = Object.keys(obj);
      let processedCount = 0;
      for (const key of keys) {
        const value = obj[key];
        const possibleId = idMap[key];
        const newKey = possibleId || key;

        newObj[newKey] = await this._walkAndRewriteIds(value, idMap);

        // Optionally update the importDialog here, after each property has been processed
        if (importDialog) {
          processedCount++;
          if (processedCount % UI_UPDATE_INTERVAL === 0) {
            // yield to the event loop to allow the UI to update
            await new Promise((resolve) => setTimeout(resolve, 0));
            const percentPersisted = Math.ceil(PERCENT_OF_DIALOG * (processedCount / keys.length));
            const message = `Rewriting ${processedCount} of ${keys.length} imported objects.`;
            importDialog.updateProgress(percentPersisted, message);
          }
        }
      }

      return newObj;
    }

    // Return the input as-is for types that are not objects, strings, or arrays
    return obj;
  }

  /**
   * @private
   * @param {Object} tree
   * @returns {Promise<Object>}
   */
  async _generateNewIdentifiers(tree, newNamespace, importDialog) {
    const idMap = this._generateIdMap(tree, newNamespace);
    tree.rootId = idMap[tree.rootId];
    tree.openmct = await this._walkAndRewriteIds(tree.openmct, idMap, importDialog);
    return tree;
  }
  /**
   * @private
   * @param {Object} domainObject
   * @param {Object} objTree
   */
  async _importObjectTree(domainObject, objTree) {
    // make rewriting objects IDs 80% of the progress bar
    const importDialog = this.openmct.overlays.progressDialog({
      progressPerc: 0,
      message: `Importing ${Object.keys(objTree.openmct).length} objects`,
      iconClass: 'info',
      title: 'Importing'
    });
    const objectsToCreate = [];
    const namespace = domainObject.identifier.namespace;
    const tree = await this._generateNewIdentifiers(objTree, namespace, importDialog);
    const rootId = tree.rootId;

    const rootObj = tree.openmct[rootId];
    delete rootObj.persisted;
    objectsToCreate.push(rootObj);
    if (this.openmct.composition.checkPolicy(domainObject, rootObj)) {
      this._deepInstantiate(rootObj, tree.openmct, [], objectsToCreate);

      try {
        let persistedObjects = 0;
        // make saving objects objects 20% of the progress bar
        await Promise.all(
          objectsToCreate.map(async (objectToCreate) => {
            persistedObjects++;
            const percentPersisted =
              Math.ceil(20 * (persistedObjects / objectsToCreate.length)) + 80;
            const message = `Saving ${persistedObjects} of ${objectsToCreate.length} imported objects.`;
            importDialog.updateProgress(percentPersisted, message);
            await this._instantiate(objectToCreate);
          })
        );
      } catch (error) {
        this.openmct.notifications.error('Error saving objects');

        throw error;
      } finally {
        importDialog.dismiss();
      }

      const compositionCollection = this.openmct.composition.get(domainObject);
      let domainObjectKeyString = this.openmct.objects.makeKeyString(domainObject.identifier);
      this.openmct.objects.mutate(rootObj, 'location', domainObjectKeyString);
      compositionCollection.add(rootObj);
    } else {
      importDialog.dismiss();
      const cannotImportDialog = this.openmct.overlays.dialog({
        iconClass: 'alert',
        message: "We're sorry, but you cannot import that object type into this object.",
        buttons: [
          {
            label: 'Ok',
            emphasis: true,
            callback: function () {
              cannotImportDialog.dismiss();
            }
          }
        ]
      });
    }
  }
  /**
   * @private
   * @param {Object} model
   * @returns {Object}
   */
  _instantiate(model) {
    return this.openmct.objects.save(model);
  }

  /**
   * @private
   * @param {Object} domainObject
   */
  _showForm(domainObject) {
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

    this.openmct.forms.showForm(formStructure).then((changes) => {
      let onSave = this.onSave.bind(this);
      onSave(domainObject, changes);
    });
  }
  /**
   * @private
   * @param {Object} data
   * @returns {boolean}
   */
  _validateJSON(data) {
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
      this.openmct.notifications.error(
        'Invalid File: The selected file was either invalid JSON or was not formatted properly for import into Open MCT.'
      );
    }

    return success;
  }
}
