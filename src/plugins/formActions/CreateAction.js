/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import PropertiesAction from './PropertiesAction';
import CreateWizard from './CreateWizard';

import { v4 as uuid } from 'uuid';
import _ from 'lodash';

export default class CreateAction extends PropertiesAction {
  #transaction;

  constructor(openmct, type, parentDomainObject) {
    super(openmct);

    this.type = type;
    this.parentDomainObject = parentDomainObject;
    this.#transaction = null;
  }

  invoke() {
    this._showCreateForm(this.type);
  }

  /**
   * @private
   */
  async _onSave(changes) {
    let parentDomainObjectPath;

    Object.entries(changes).forEach(([key, value]) => {
      if (key === 'location') {
        parentDomainObjectPath = value;

        return;
      }

      const existingValue = this.domainObject[key];
      if (!(existingValue instanceof Array) && typeof existingValue === 'object') {
        value = _.merge(existingValue, value);
      }

      _.set(this.domainObject, key, value);
    });

    const parentDomainObject = this.openmct.objects.toMutable(parentDomainObjectPath[0]);

    this.domainObject.modified = Date.now();
    this.domainObject.location = this.openmct.objects.makeKeyString(parentDomainObject.identifier);
    this.domainObject.identifier.namespace = parentDomainObject.identifier.namespace;

    // Show saving progress dialog
    let dialog = this.openmct.overlays.progressDialog({
      progressPerc: 'unknown',
      message:
        'Do not navigate away from this page or close this browser tab while this message is displayed.',
      iconClass: 'info',
      title: 'Saving'
    });

    try {
      await this.openmct.objects.save(this.domainObject);
      const compositionCollection = await this.openmct.composition.get(parentDomainObject);
      compositionCollection.add(this.domainObject);
      await this.saveTransaction();

      this._navigateAndEdit(this.domainObject, parentDomainObjectPath);

      this.openmct.notifications.info('Save successful');
    } catch (err) {
      console.error(err);
      this.openmct.notifications.error(`Error saving objects: ${err}`);
    } finally {
      this.openmct.objects.destroyMutable(parentDomainObject);
      dialog.dismiss();
    }
  }

  /**
   * @private
   */
  _onCancel() {
    this.#transaction.cancel().then(() => {
      this.openmct.objects.endTransaction();
      this.#transaction = null;
    });
  }

  /**
   * @private
   */
  async _navigateAndEdit(domainObject, parentDomainObjectpath) {
    let objectPath;
    let self = this;
    if (parentDomainObjectpath) {
      objectPath = parentDomainObjectpath && [domainObject].concat(parentDomainObjectpath);
    } else {
      objectPath = await this.openmct.objects.getOriginalPath(domainObject.identifier);
    }

    const url =
      '#/browse/' +
      objectPath
        .map((object) => object && this.openmct.objects.makeKeyString(object.identifier))
        .reverse()
        .join('/');

    function editObject() {
      const objectView = self.openmct.objectViews.get(domainObject, objectPath)[0];
      const canEdit =
        objectView && objectView.canEdit && objectView.canEdit(domainObject, objectPath);

      if (canEdit) {
        self.openmct.editor.edit();
      }
    }

    this.openmct.router.once('afterNavigation', editObject);

    this.openmct.router.navigate(url);
  }

  /**
   * @private
   */
  _showCreateForm(type) {
    const typeDefinition = this.openmct.types.get(type);
    const definition = typeDefinition.definition;
    const domainObject = {
      name: `Unnamed ${definition.name}`,
      type,
      identifier: {
        key: uuid(),
        namespace: this.parentDomainObject.identifier.namespace
      }
    };

    this.domainObject = this.openmct.objects.toMutable(domainObject);

    if (definition.initialize) {
      definition.initialize(this.domainObject);
    }

    const createWizard = new CreateWizard(this.openmct, this.domainObject, this.parentDomainObject);
    const formStructure = createWizard.getFormStructure(true);
    formStructure.title = 'Create a New ' + definition.name;

    this.startTransaction();

    this.openmct.forms
      .showForm(formStructure)
      .then(this._onSave.bind(this))
      .catch(this._onCancel.bind(this))
      .finally(() => {
        this.openmct.objects.destroyMutable(this.domainObject);
      });
  }

  startTransaction() {
    if (!this.openmct.objects.isTransactionActive()) {
      this.#transaction = this.openmct.objects.startTransaction();
    }
  }

  async saveTransaction() {
    if (!this.#transaction) {
      return;
    }

    await this.#transaction.commit();
    this.openmct.objects.endTransaction();
    this.#transaction = null;
  }
}
