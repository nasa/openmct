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

import {
  CAPSULE_IDENTIFIER,
  CAPSULE_KEY,
  CAPSULE_TYPE,
  ROOT_IDENTIFIER,
  ROOT_KEY,
  STREAM_IDENTIFIER,
  STREAM_TYPE
} from './constants.js';
import VerificationCompositionProvider from './VerificationCompositionProvider.js';
import VerificationObjectProvider from './VerificationObjectProvider.js';
import VerificationTelemetryMetadataProvider from './VerificationTelemetryMetadataProvider.js';
import VerificationTelemetryProvider from './VerificationTelemetryProvider.js';

describe('verification telemetry providers', () => {
  const streamObject = {
    identifier: STREAM_IDENTIFIER,
    type: STREAM_TYPE
  };

  it('provides root, capsule, and event stream objects', async () => {
    const provider = new VerificationObjectProvider();

    const root = await provider.get(ROOT_IDENTIFIER);
    const capsule = await provider.get(CAPSULE_IDENTIFIER);
    const stream = await provider.get(STREAM_IDENTIFIER);

    expect(root.type).toBe('folder');
    expect(root.identifier.key).toBe(ROOT_KEY);
    expect(capsule.type).toBe(CAPSULE_TYPE);
    expect(capsule.identifier.key).toBe(CAPSULE_KEY);
    expect(stream.type).toBe(STREAM_TYPE);
    expect(stream.telemetry.values.length).toBeGreaterThan(0);
  });

  it('loads object composition', async () => {
    const provider = new VerificationCompositionProvider();

    expect(provider.appliesTo({ identifier: ROOT_IDENTIFIER })).toBeTrue();
    expect(provider.appliesTo({ identifier: CAPSULE_IDENTIFIER })).toBeTrue();
    expect(provider.appliesTo(streamObject)).toBeFalse();
    expect(await provider.load({ identifier: ROOT_IDENTIFIER })).toEqual([CAPSULE_IDENTIFIER]);
    expect(await provider.load({ identifier: CAPSULE_IDENTIFIER })).toEqual([STREAM_IDENTIFIER]);
  });

  it('provides telemetry metadata for event streams', () => {
    const provider = new VerificationTelemetryMetadataProvider();

    expect(provider.supportsMetadata(streamObject)).toBeTrue();
    expect(provider.getMetadata(streamObject).values.map((value) => value.key)).toContain(
      'status_code'
    );
  });

  it('requests historical events by time range', async () => {
    const provider = new VerificationTelemetryProvider();

    expect(provider.supportsRequest(streamObject)).toBeTrue();

    const events = await provider.request(streamObject, {
      start: 1780000006000,
      end: 1780000009000
    });

    expect(events.length).toBe(4);
    expect(events[0].event_type).toBe('semantic_packet_bound');
    expect(events[events.length - 1].event_type).toBe('challenge_started');
  });

  it('supports latest request strategy', async () => {
    const provider = new VerificationTelemetryProvider();
    const events = await provider.request(streamObject, {
      start: Number.MIN_SAFE_INTEGER,
      end: Number.MAX_SAFE_INTEGER,
      strategy: 'latest'
    });

    expect(events).toHaveSize(1);
    expect(events[0].event_type).toBe('report_exported');
  });

  it('supports realtime subscription and cleanup', (done) => {
    const provider = new VerificationTelemetryProvider({
      subscribeInterval: 1
    });

    expect(provider.supportsSubscribe(streamObject)).toBeTrue();
    const unsubscribe = provider.subscribe(streamObject, (event) => {
      expect(event.event_id).toBeDefined();
      unsubscribe();
      done();
    });
  });
});
