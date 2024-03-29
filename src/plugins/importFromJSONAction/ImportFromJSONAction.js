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
   * @private
   * @param {Object} tree
   * @param {Object} importDialog
   * @returns {Promise}
   */
  async _generateNewIdentifiers(tree, newNamespace, importDialog) {
    const keys = Object.keys(tree.openmct);
    const numberOfObjects = keys.length;
    for (let i = 0; i < numberOfObjects; i++) {
      const domainObjectId = keys[i];
      const percentRewritten = Math.ceil(80 * ((i + 1) / numberOfObjects));
      const message = `Rewriting ${i + 1} of ${numberOfObjects} object IDs`;

      // Artificially introduce asynchrony
      await new Promise((resolve) => setTimeout(resolve, 0));

      importDialog.updateProgress(percentRewritten, message);

      const oldId = parseKeyString(domainObjectId);
      const newId = {
        namespace: newNamespace,
        key: uuid()
      };
      tree = this._rewriteId(oldId, newId, tree);
    }
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
        // make saving objects objects 70% of the progress bar
        await Promise.all(
          objectsToCreate.map(async (objectToCreate) => {
            persistedObjects++;
            const percentPersisted = Math.ceil(20 * (persistedObjects / objectsToCreate.length));
            const message = `Saving imported ${persistedObjects} of ${objectsToCreate.length} objects.`;

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
      this.importDialog.dismiss();
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
   * @param {Object} oldId
   * @param {Object} newId
   * @param {Object} tree
   * @returns {Object}
   */
  _rewriteId(oldId, newId, tree) {
    let newIdKeyString = this.openmct.objects.makeKeyString(newId);
    let oldIdKeyString = this.openmct.objects.makeKeyString(oldId);
    const newTreeString = JSON.stringify(tree).replace(
      new RegExp(oldIdKeyString, 'g'),
      newIdKeyString
    );
    const newTree = JSON.parse(newTreeString, (key, value) => {
      if (
        value !== undefined &&
        value !== null &&
        Object.prototype.hasOwnProperty.call(value, 'key') &&
        Object.prototype.hasOwnProperty.call(value, 'namespace')
      ) {
        // first check if key is messed up from regex and contains a colon
        // if it does, repair it
        if (value.key.includes(':')) {
          const splitKey = value.key.split(':');
          value.key = splitKey[1];
          value.namespace = splitKey[0];
        }
        // now check if we need to replace the id
        if (value.key === oldId.key && value.namespace === oldId.namespace) {
          return newId;
        }
      }
      return value;
    });
    return newTree;
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
