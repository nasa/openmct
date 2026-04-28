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

import mount from 'utils/mount';

import AutoCompleteField from './components/controls/AutoCompleteField.vue';
import CheckBoxField from './components/controls/CheckBoxField.vue';
import ClockDisplayFormatField from './components/controls/ClockDisplayFormatField.vue';
import Datetime from './components/controls/DatetimeField.vue';
import FileInput from './components/controls/FileInput.vue';
import Locator from './components/controls/LocatorField.vue';
import NumberField from './components/controls/NumberField.vue';
import SelectField from './components/controls/SelectField.vue';
import TextAreaField from './components/controls/TextAreaField.vue';
import TextField from './components/controls/TextField.vue';
import ToggleSwitchField from './components/controls/ToggleSwitchField.vue';

/** @type {Record<string, import('vue').Component>} */
export const DEFAULT_CONTROLS_MAP = {
  autocomplete: AutoCompleteField,
  checkbox: CheckBoxField,
  composite: ClockDisplayFormatField,
  datetime: Datetime,
  'file-input': FileInput,
  locator: Locator,
  numberfield: NumberField,
  select: SelectField,
  textarea: TextAreaField,
  textfield: TextField,
  toggleSwitch: ToggleSwitchField
};

export default class FormControl {
  /** @type {Record<string, ControlViewProvider>} */
  controls;

  /**
   * @param {OpenMCT} openmct
   */
  constructor(openmct) {
    this.openmct = openmct;
    this.controls = {};

    this._addDefaultFormControls();
  }

  /**
   * @param {string} controlName
   * @param {ControlViewProvider} controlViewProvider
   */
  addControl(controlName, controlViewProvider) {
    const control = this.controls[controlName];
    if (control) {
      console.warn(`Error: provided form control '${controlName}', already exists`);

      return;
    }

    this.controls[controlName] = controlViewProvider;
  }

  /**
   * @param {string} controlName
   * @returns {ControlViewProvider | undefined}
   */
  getControl(controlName) {
    const control = this.controls[controlName];
    if (!control) {
      console.error(`Error: form control '${controlName}', does not exist`);
    }

    return control;
  }

  /**
   * @private
   */
  _addDefaultFormControls() {
    Object.keys(DEFAULT_CONTROLS_MAP).forEach((control) => {
      const controlViewProvider = this._getControlViewProvider(control);
      this.addControl(control, controlViewProvider);
    });
  }

  /**
   * @private
   * @param {string} control
   * @returns {ControlViewProvider}
   */
  _getControlViewProvider(control) {
    const self = this;
    let _destroy = null;

    return {
      show(element, model, onChange) {
        const { vNode, destroy } = mount(
          {
            el: element,
            components: {
              FormControlComponent: DEFAULT_CONTROLS_MAP[control]
            },
            provide: {
              openmct: self.openmct
            },
            data() {
              return {
                model,
                onChange
              };
            },
            template: `<FormControlComponent :model="model" @on-change="onChange"></FormControlComponent>`
          },
          {
            element,
            app: self.openmct.app
          }
        );
        _destroy = destroy;

        return vNode;
      },
      destroy() {
        if (_destroy) {
          _destroy();
        }
      }
    };
  }
}

/**
 * @typedef {import('openmct')} OpenMCT
 */

/**
 * @typedef {Object} ControlViewProvider
 * @property {(element: HTMLElement, model: any, onChange: Function) => any} show
 * @property {() => void} destroy
 */
