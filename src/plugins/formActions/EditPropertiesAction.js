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

import _ from 'lodash';

import CreateWizard from './CreateWizard';
import PropertiesAction from './PropertiesAction';

export default class EditPropertiesAction extends PropertiesAction {
  constructor(openmct) {
    super(openmct);

    this.name = 'Edit Properties...';
    this.key = 'properties';
    this.description = 'Edit properties of this object.';
    this.cssClass = 'major icon-pencil';
    this.hideInDefaultMenu = true;
    this.group = 'action';
    this.priority = 10;
    this.formProperties = {};
  }

  appliesTo(objectPath) {
    const object = objectPath[0];
    const definition = this._getTypeDefinition(object.type);
    const persistable = this.openmct.objects.isPersistable(object.identifier);

    return persistable && definition && definition.creatable;
  }

  invoke(objectPath) {
    return this._showEditForm(objectPath);
  }

  /**
   * @private
   */
  async _onSave(changes) {
    if (!this.openmct.objects.isTransactionActive()) {
      this.openmct.objects.startTransaction();
    }

    try {
      Object.entries(changes).forEach(([key, value]) => {
        const existingValue = this.domainObject[key];
        if (!Array.isArray(existingValue) && typeof existingValue === 'object') {
          value = _.merge(existingValue, value);
        }

        this.openmct.objects.mutate(this.domainObject, key, value);
      });
      const transaction = this.openmct.objects.getActiveTransaction();
      await transaction.commit();
      this.openmct.objects.endTransaction();
    } catch (error) {
      this.openmct.notifications.error('Error saving objects');
      console.error(error);
    }
  }

  /**
   * @private
   */
  _onCancel() {
    //noop
  }

  /**
   * @private
   */
  _showEditForm(objectPath) {
    this.domainObject = objectPath[0];

    const createWizard = new CreateWizard(this.openmct, this.domainObject, objectPath[1]);
    const formStructure = createWizard.getFormStructure(false);
    formStructure.title = 'Edit ' + this.domainObject.name;

    return this.openmct.forms
      .showForm(formStructure)
      .then(this._onSave.bind(this))
      .catch(this._onCancel.bind(this));
  }
}
