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
import { createOpenMct, resetApplicationState } from '../../utils/testing.js';
import StatusAPI from './StatusAPI.js';

describe('The Status API', () => {
  let statusAPI;
  let openmct;
  let identifier;
  let status;
  let status2;
  let callback;

  beforeEach(() => {
    openmct = createOpenMct();
    statusAPI = new StatusAPI(openmct);
    identifier = {
      namespace: 'test-namespace',
      key: 'test-key'
    };
    status = 'test-status';
    status2 = 'test-status-deux';
    callback = jasmine.createSpy('callback', (statusUpdate) => statusUpdate);
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('set function', () => {
    it('sets status for identifier', () => {
      statusAPI.set(identifier, status);

      let resultingStatus = statusAPI.get(identifier);

      expect(resultingStatus).toEqual(status);
    });
  });

  describe('get function', () => {
    it('returns status for identifier', () => {
      statusAPI.set(identifier, status2);

      let resultingStatus = statusAPI.get(identifier);

      expect(resultingStatus).toEqual(status2);
    });
  });

  describe('delete function', () => {
    it('deletes status for identifier', () => {
      statusAPI.set(identifier, status);

      let resultingStatus = statusAPI.get(identifier);
      expect(resultingStatus).toEqual(status);

      statusAPI.delete(identifier);
      resultingStatus = statusAPI.get(identifier);

      expect(resultingStatus).toBeUndefined();
    });
  });

  describe('observe function', () => {
    it('allows callbacks to be attached to status set and delete events', () => {
      let unsubscribe = statusAPI.observe(identifier, callback);
      statusAPI.set(identifier, status);

      expect(callback).toHaveBeenCalledWith(status);

      statusAPI.delete(identifier);

      expect(callback).toHaveBeenCalledWith(undefined);
      unsubscribe();
    });

    it('returns a unsubscribe function', () => {
      let unsubscribe = statusAPI.observe(identifier, callback);
      unsubscribe();

      statusAPI.set(identifier, status);

      expect(callback).toHaveBeenCalledTimes(0);
    });
  });
});
