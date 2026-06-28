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

import { createOpenMct, resetApplicationState } from '../../src/utils/testing.js';
import { ROOT_IDENTIFIER, STREAM_IDENTIFIER } from './constants.js';
import VerificationTelemetryPlugin from './plugin.js';

describe('verification telemetry plugin', () => {
  let openmct;

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.install(VerificationTelemetryPlugin({ subscribeInterval: 1 }));
    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(async () => {
    await resetApplicationState(openmct);
  });

  it('registers a root object and sample event stream', async () => {
    const root = await openmct.objects.get(ROOT_IDENTIFIER);
    const stream = await openmct.objects.get(STREAM_IDENTIFIER);

    expect(root.name).toBe('Verification Telemetry');
    expect(stream.name).toBe('Sample Verification Events');
  });

  it('serves verification telemetry through the Open MCT telemetry API', async () => {
    const stream = await openmct.objects.get(STREAM_IDENTIFIER);
    const events = await openmct.telemetry.request(stream, {
      start: Number.MIN_SAFE_INTEGER,
      end: Number.MAX_SAFE_INTEGER
    });

    expect(events.length).toBeGreaterThan(0);
    expect(events.map((event) => event.event_type)).toContain('mutation_rejected');
  });
});
