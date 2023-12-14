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

import ExampleUserProvider from '../../../example/exampleUser/ExampleUserProvider';
import { createOpenMct, resetApplicationState } from '../../utils/testing';
import { MULTIPLE_PROVIDER_ERROR } from './constants';

const USERNAME = 'Test User';
const EXAMPLE_ROLE = 'flight';

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

  describe('provides the ability', () => {
    let provider;

    beforeEach(() => {
      provider = new ExampleUserProvider(openmct);
      provider.autoLogin(USERNAME);
    });

    it('to check if a user (not specific) is logged in', (done) => {
      expect(openmct.user.isLoggedIn()).toBeFalse();

      openmct.user.on('providerAdded', () => {
        expect(openmct.user.isLoggedIn()).toBeTrue();
        done();
      });

      // this will trigger the user indicator plugin,
      // which will in turn login the user
      openmct.user.setProvider(provider);
    });

    it('to get the current user', (done) => {
      openmct.user.setProvider(provider);
      openmct.user
        .getCurrentUser()
        .then((apiUser) => {
          expect(apiUser.name).toEqual(USERNAME);
        })
        .finally(done);
    });

    it('to check if a user has a specific role (by id)', (done) => {
      openmct.user.setProvider(provider);
      let junkIdCheckPromise = openmct.user.hasRole('junk-id').then((hasRole) => {
        expect(hasRole).toBeFalse();
      });
      let realIdCheckPromise = openmct.user.hasRole(EXAMPLE_ROLE).then((hasRole) => {
        expect(hasRole).toBeTrue();
      });

      Promise.all([junkIdCheckPromise, realIdCheckPromise]).finally(done);
    });
  });
});
