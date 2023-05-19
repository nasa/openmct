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

import { createOpenMct, resetApplicationState } from 'utils/testing';
import Vue from 'vue';
import ExampleUserProvider from '../../../example/exampleUser/ExampleUserProvider';

const USERNAME = 'Coach McGuirk';

describe('The User Indicator plugin', () => {
  let openmct;
  let element;
  let child;
  let appHolder;
  let userIndicator;
  let provider;

  beforeEach((done) => {
    appHolder = document.createElement('div');
    appHolder.style.width = '640px';
    appHolder.style.height = '480px';
    document.body.appendChild(appHolder);

    element = document.createElement('div');
    child = document.createElement('div');
    element.appendChild(child);

    openmct = createOpenMct();
    openmct.on('start', done);
    openmct.start(appHolder);
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('will not show, if there is no user provider', () => {
    userIndicator = openmct.indicators.indicatorObjects.find(
      (indicator) => indicator.key === 'user-indicator'
    );

    expect(userIndicator).toBe(undefined);
  });

  describe('with a user provider installed', () => {
    beforeEach(() => {
      provider = new ExampleUserProvider(openmct);
      provider.autoLogin(USERNAME);

      openmct.user.setProvider(provider);

      return Vue.nextTick();
    });

    it('exists', () => {
      userIndicator = openmct.indicators.indicatorObjects.find(
        (indicator) => indicator.key === 'user-indicator'
      ).element;

      const hasClockIndicator = userIndicator !== null && userIndicator !== undefined;
      expect(hasClockIndicator).toBe(true);
    });

    it('contains the logged in user name', (done) => {
      openmct.user
        .getCurrentUser()
        .then(async (user) => {
          await Vue.nextTick();

          userIndicator = openmct.indicators.indicatorObjects.find(
            (indicator) => indicator.key === 'user-indicator'
          ).element;

          const userName = userIndicator.textContent.trim();

          expect(user.name).toEqual(USERNAME);
          expect(userName).toContain(USERNAME);
        })
        .finally(done);
    });
  });
});
