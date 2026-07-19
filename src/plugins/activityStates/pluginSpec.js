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

import { createOpenMct, resetApplicationState } from 'utils/testing';

import {
  ACTIVITY_STATES_KEY,
  createActivityStatesIdentifier
} from './createActivityStatesIdentifier.js';

const MISSING_NAME = `Missing: ${ACTIVITY_STATES_KEY}`;
const DEFAULT_NAME = 'Activity States';
const activityStatesIdentifier = createActivityStatesIdentifier();

describe('the plugin', () => {
  let openmct;
  let missingObj = {
    identifier: activityStatesIdentifier,
    type: 'unknown',
    name: MISSING_NAME
  };

  describe('with no arguments passed in', () => {
    beforeEach((done) => {
      openmct = createOpenMct();
      openmct.install(openmct.plugins.PlanLayout());

      openmct.on('start', done);
      openmct.startHeadless();
    });

    afterEach(() => {
      return resetApplicationState(openmct);
    });

    it('when installed, adds "Activity States"', async () => {
      const activityStatesObject = await openmct.objects.get(activityStatesIdentifier);
      expect(activityStatesObject.name).toBe(DEFAULT_NAME);
      expect(activityStatesObject).toBeDefined();
    });

    describe('adds an interceptor that returns a "Activity States" model for', () => {
      let activityStatesObject;
      let mockNotFoundProvider;
      let activeProvider;

      beforeEach(async () => {
        mockNotFoundProvider = {
          get: () => Promise.reject(new Error('Not found')),
          create: () => Promise.resolve(missingObj),
          update: () => Promise.resolve(missingObj)
        };

        activeProvider = mockNotFoundProvider;
        spyOn(openmct.objects, 'getProvider').and.returnValue(activeProvider);
        activityStatesObject = await openmct.objects.get(activityStatesIdentifier);
      });

      it('missing objects', () => {
        let idsMatch = openmct.objects.areIdsEqual(
          activityStatesObject.identifier,
          activityStatesIdentifier
        );

        expect(activityStatesObject).toBeDefined();
        expect(idsMatch).toBeTrue();
      });
    });
  });
});
