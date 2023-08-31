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
import EventMessageGeneratorPlugin from './plugin.js';
import { createOpenMct, resetApplicationState } from '../../src/utils/testing';

describe('the plugin', () => {
  let openmct;
  const mockDomainObject = {
    identifier: {
      namespace: '',
      key: 'some-value'
    },
    telemetry: {
      duration: 0
    },
    options: {},
    type: 'eventGenerator'
  };

  beforeEach((done) => {
    const options = {};
    openmct = createOpenMct();
    openmct.install(new EventMessageGeneratorPlugin(options));
    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(async () => {
    await resetApplicationState(openmct);
  });

  describe('the plugin', () => {
    it('supports subscription', (done) => {
      const unsubscribe = openmct.telemetry.subscribe(mockDomainObject, (telemetry) => {
        expect(telemetry).not.toEqual(null);
        expect(telemetry.message).toContain('CC: Eagle, Houston');
        expect(unsubscribe).not.toEqual(null);
        unsubscribe();
        done();
      });
    });

    it('supports requests without start/end defined', async () => {
      const telemetry = await openmct.telemetry.request(mockDomainObject);
      expect(telemetry[0].message).toContain('CC: Eagle, Houston');
    });

    it('supports requests with arbitrary start time in the past', async () => {
      mockDomainObject.options.start = 100000000000; // Mar 03 1973
      const telemetry = await openmct.telemetry.request(mockDomainObject);
      expect(telemetry[0].message).toContain('CC: Eagle, Houston');
    });
  });
});
