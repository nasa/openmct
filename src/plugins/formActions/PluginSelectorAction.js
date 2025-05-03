/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import mount from 'utils/mount';

import PluginSelectorFormController from './components/PluginSelectorFormController.vue';
import PropertiesAction from './PropertiesAction.js';

const PLUGIN_SELECTOR_ACTION_KEY = 'pluginSelector';
const PLUGIN_SELECTOR_FORM_CONTROL_KEY = 'selectPlugins';
const PLUGIN_SELECTOR_CONTROL_KEY = 'plugin-selector';

class PluginSelectorAction extends PropertiesAction {
  constructor(openmct) {
    super(openmct);

    this.key = PLUGIN_SELECTOR_ACTION_KEY;
    this.isHidden = true;
  }

  get invoke() {
    return (parentDomainObject) => this.#showPluginSelectorForm(parentDomainObject);
  }

  /**
   * @private
   */
  #showPluginSelectorForm(parentDomainObject) {
    if (!this.openmct.forms.formController.controls[PLUGIN_SELECTOR_CONTROL_KEY]) {
      this.openmct.forms.addNewFormControl(
        PLUGIN_SELECTOR_CONTROL_KEY,
        this.#getPluginSelectorFormController(this.openmct)
      );
    }

    const formStructure = {
      title: 'Plugin Selector',
      sections: [
        {
          rows: [
            {
              name: 'Select Plugins To Load/Unload',
              key: PLUGIN_SELECTOR_FORM_CONTROL_KEY,
              control: PLUGIN_SELECTOR_CONTROL_KEY,
              required: false
            }
          ]
        }
      ]
    };

    return this.openmct.forms
      .showForm(formStructure)
      .then(this.#onSave.bind(this))
      .catch(this.#onCancel.bind(this));
  }

  #onSave(data) {
    let changes = data[PLUGIN_SELECTOR_FORM_CONTROL_KEY];
    if (changes) {
      Object.entries(changes).forEach(([pluginType, isChecked]) => {
        if (isChecked) {
          this.openmct.types.types[pluginType] = this.openmct.types.deactivatedTypes[pluginType];
          this.openmct.types.removeDeactivatedType(pluginType);
        } else {
          this.openmct.types.deactivatedTypes[pluginType] = this.openmct.types.types[pluginType];
          this.openmct.types.removeType(pluginType);
        }

        this.openmct.notifications.info('Plugin list update successful');
      });
    }
  }

  #onCancel() {}

  #getPluginSelectorFormController(openmct) {
    let destroyComponent;

    return {
      show(element, model, onChange) {
        const { vNode, destroy } = mount(
          {
            el: element,
            components: {
              PluginSelectorFormController
            },
            provide: {
              openmct
            },
            data() {
              return {
                model,
                onChange
              };
            },
            template: `<PluginSelectorFormController :model="model" @on-change="onChange"></PluginSelectorFormController>`
          },
          {
            app: openmct.app,
            element
          }
        );
        destroyComponent = destroy;

        return vNode.componentInstance;
      },
      destroy() {
        destroyComponent();
      }
    };
  }
}

export { PLUGIN_SELECTOR_ACTION_KEY };

export default PluginSelectorAction;
