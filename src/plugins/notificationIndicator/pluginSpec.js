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

import { createOpenMct, resetApplicationState } from 'utils/testing';
import Vue from 'vue';

import NotificationIndicatorPlugin from './plugin.js';

describe('the plugin', () => {
  let notificationIndicatorPlugin;
  let openmct;
  let indicatorElement;
  let parentElement;
  let mockMessages = ['error', 'test', 'notifications'];

  beforeEach((done) => {
    openmct = createOpenMct();

    notificationIndicatorPlugin = new NotificationIndicatorPlugin();
    openmct.install(notificationIndicatorPlugin);

    parentElement = document.createElement('div');

    openmct.on('start', () => {
      mockMessages.forEach((message) => {
        openmct.notifications.error(message);
      });
      done();
    });

    openmct.start();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('the indicator plugin element', () => {
    beforeEach(() => {
      parentElement.append(indicatorElement);

      return Vue.nextTick();
    });

    it('notifies the user of the number of notifications', () => {
      let notificationCountElement = document.querySelector('.c-indicator__count');

      expect(notificationCountElement.innerText).toEqual('1');
    });
  });
});
