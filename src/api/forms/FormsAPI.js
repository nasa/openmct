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

import _ from 'lodash';
import mount from 'utils/mount';

import FormProperties from './components/FormProperties.vue';
import FormController from './FormController.js';

/**
 * The FormsAPI provides methods for creating and managing forms in Open MCT.
 */
export default class FormsAPI {
  /**
   * Creates an instance of FormsAPI.
   * @param {import('openmct').OpenMCT} openmct - The Open MCT API
   */
  constructor(openmct) {
    this.openmct = openmct;
    this.formController = new FormController(openmct);
  }

  /**
   * Control View Provider definition for a form control
   * @typedef ControlViewProvider
   * @property {function} show a function renders view in place of given element
   *   This function accepts element, model and onChange function
   *   element - html element (place holder) to render a row view
   *   model - row data for rendering name, value etc for given row type
   *   onChange - an onChange event callback function to keep track of any change in value
   * @property {function} destroy a callback function when a vue component gets destroyed
   */

  /**
   * Create a new form control definition with a formControlViewProvider
   *      this formControlViewProvider is used inside form overlay to show/render a form row
   *
   * @param {string} controlName a form structure, array of section
   * @param {ControlViewProvider} controlViewProvider
   */
  addNewFormControl(controlName, controlViewProvider) {
    this.formController.addControl(controlName, controlViewProvider);
  }

  /**
   * Get a ControlViewProvider for a given/stored form controlName
   *
   * @param {string} controlName a form structure, array of section
   * @return {ControlViewProvider}
   */
  getFormControl(controlName) {
    return this.formController.getControl(controlName);
  }

  /**
   * Section definition for formStructure
   * @typedef Section
   * @property {Object} name Name of the section to display on Form
   * @property {string} cssClass class name for styling section
   * @property {array<Row>} rows collection of rows inside a section
   */

  /**
   * Row definition for Section
   * @typedef Row
   * @property {string} control represents type of row to render
   *     eg:autocomplete,composite,datetime,file-input,locator,numberfield,select,textarea,textfield
   * @property {string} cssClass class name for styling this row
   * @property {import('openmct').DomainObject} domainObject object to be used by row
   * @property {string} key id for this row
   * @property {string} name Name of the row to display on Form
   * @property {import('openmct').DomainObject} parent parent object to be used by row
   * @property {boolean} required is this row mandatory
   * @property {function} validate a function to validate this row on any changes
   */

  /**
   * Show form inside an Overlay dialog with given form structure
   * @param {Array<Section>} formStructure a form structure, array of section
   * @param {Object} options
   * @param {() => void} [options.onChange] a callback function when any changes detected
   * @returns {Promise<Object>} A promise that resolves with the form data when saved, or rejects when cancelled
   */
  showForm(formStructure, { onChange } = {}) {
    let overlay;

    const self = this;

    const overlayEl = document.createElement('div');
    overlayEl.classList.add('u-contents');

    overlay = self.openmct.overlays.overlay({
      element: overlayEl,
      size: 'dialog'
    });

    let formSave;
    let formCancel;
    const promise = new Promise((resolve, reject) => {
      formSave = resolve;
      formCancel = reject;
    });

    this.showCustomForm(formStructure, {
      element: overlayEl,
      onChange
    })
      .then((response) => {
        overlay.dismiss();
        formSave(response);
      })
      .catch((response) => {
        overlay.dismiss();
        formCancel(response);
      });

    return promise;
  }

  /**
   * Show form as a child of the element provided with given form structure
   *
   * @param {Array<Section>} formStructure a form structure, array of section
   * @param {Object} options
   * @param {HTMLElement} options.element Parent Element to render a Form
   * @param {() => void} [options.onChange] a callback function when any changes detected
   * @returns {Promise<Object>} A promise that resolves with the form data when saved, or rejects when cancelled
   */
  showCustomForm(formStructure, { element, onChange } = {}) {
    if (element === undefined) {
      throw Error('Required element parameter not provided');
    }

    const self = this;

    const changes = {};
    let formSave;
    let formCancel;

    const promise = new Promise((resolve, reject) => {
      formSave = onFormAction(resolve);
      formCancel = onFormAction(reject);
    });

    const { destroy } = mount(
      {
        components: { FormProperties },
        provide: {
          openmct: self.openmct
        },
        data() {
          return {
            formStructure,
            onChange: onFormPropertyChange,
            onCancel: formCancel,
            onSave: formSave
          };
        },
        template:
          '<FormProperties :model="formStructure" @on-change="onChange" @on-cancel="onCancel" @on-save="onSave"></FormProperties>'
      },
      {
        element,
        app: self.openmct.app
      }
    );

    /**
     * Handles form property changes
     * @param {Object} data - The changed form data
     */
    function onFormPropertyChange(data) {
      if (onChange) {
        onChange(data);
      }

      if (data.model) {
        const property = data.model.property;
        let key = data.model.key;

        if (property && property.length) {
          key = property.join('.');
        }

        _.set(changes, key, data.value);
      }
    }

    /**
     * Creates a form action handler
     * @param {() => void} callback - The callback to be called when the form action is triggered
     * @returns {(...args: any[]) => void} The form action handler
     */
    function onFormAction(callback) {
      return () => {
        destroy();

        if (callback) {
          callback(changes);
        }
      };
    }

    return promise;
  }
}
