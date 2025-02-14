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

import { createMouseEvent, createOpenMct, resetApplicationState } from 'utils/testing';
import { nextTick } from 'vue';

describe('Plugin Selector action', () => {
  const PLUGIN_SELECTOR_ACTION_KEY = 'pluginSelector';

  let openmct;
  let pluginSelectorAction;

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.on('start', done);
    openmct.startHeadless();

    pluginSelectorAction = openmct.actions.getAction(PLUGIN_SELECTOR_ACTION_KEY);
  });

  afterEach(() => {
    resetApplicationState(openmct);
  });

  it('Plugin Selector action exist', () => {
    expect(pluginSelectorAction.key).toEqual(PLUGIN_SELECTOR_ACTION_KEY);
  });

  it('Plugin Selector action shows form when invoked', (done) => {
    pluginSelectorAction
      .invoke()
      .then(() => {
        done();
      })
      .catch(() => {
        done();
      });

    nextTick(() => {
      const form = document.querySelector('.js-form');
      const title = form.querySelector('.js-form-title');
      expect(title.innerText).toEqual('Plugin Selector');

      const label = form.querySelector('.c-form-row__label');
      expect(label.innerText).toEqual('Select Plugins To Load/Unload');

      const buttons = form.querySelectorAll('button');
      expect(buttons[0].textContent.trim()).toEqual('Ok');
      expect(buttons[1].textContent.trim()).toEqual('Cancel');

      const clickEvent = createMouseEvent('click');
      buttons[1].dispatchEvent(clickEvent);
    });
  });
});
