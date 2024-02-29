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

import ExampleUserProvider from '../../../example/exampleUser/ExampleUserProvider.js';
import { createOpenMct, resetApplicationState } from '../../utils/testing.js';
import { MULTIPLE_PROVIDER_ERROR } from './constants.js';

describe('The User API', () => {
  let openmct;

  beforeEach(() => {
    openmct = createOpenMct();
  });

  afterEach(() => {
    const activeOverlays = openmct.overlays.activeOverlays;
    activeOverlays.forEach((overlay) => overlay.dismiss());

    return resetApplicationState(openmct);
  });

  describe('with regard to user providers', () => {
    it('allows you to specify a user provider', () => {
      openmct.user.on('providerAdded', (provider) => {
        expect(provider).toBeInstanceOf(ExampleUserProvider);
      });
      openmct.user.setProvider(new ExampleUserProvider(openmct));
    });

    it('prevents more than one user provider from being set', () => {
      openmct.user.setProvider(new ExampleUserProvider(openmct));

      expect(() => {
        openmct.user.setProvider({});
      }).toThrow(new Error(MULTIPLE_PROVIDER_ERROR));
    });

    it('provides a check for an existing user provider', () => {
      expect(openmct.user.hasProvider()).toBeFalse();

      openmct.user.setProvider(new ExampleUserProvider(openmct));

      expect(openmct.user.hasProvider()).toBeTrue();
    });
  });
});
