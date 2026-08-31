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
  layerToCode,
  normalizeEvents,
  sanitizeText,
  severityToCode,
  statusToCode,
  toOpenMctDatum
} from './verificationEventsAdapter.js';

describe('verification telemetry event adapter', () => {
  it('maps known values to numeric telemetry codes', () => {
    expect(statusToCode('valid')).toBe(1);
    expect(statusToCode('expected_failure')).toBe(-3);
    expect(layerToCode('core')).toBe(1);
    expect(layerToCode('challenge')).toBe(7);
    expect(severityToCode('critical')).toBe(-3);
  });

  it('maps unknown values to stable fallbacks', () => {
    expect(statusToCode('not-a-status')).toBe(-9);
    expect(layerToCode('not-a-layer')).toBe(9);
    expect(severityToCode('not-a-severity')).toBe(0);
  });

  it('sanitizes text fields without rendering markup', () => {
    expect(sanitizeText('  <img src=x onerror=alert(1)>  ')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
    expect(sanitizeText('x'.repeat(5000))).toHaveSize(4096);
    expect(sanitizeText(null)).toBe('');
  });

  it('normalizes event telemetry for Open MCT', () => {
    const datum = toOpenMctDatum({
      timestamp: 1780000000000,
      event_id: 'evt_1',
      event_type: 'core_verified',
      layer: 'core',
      status: 'valid',
      severity: 'nominal',
      summary: 'Core valid',
      branch_id: 'branch_main'
    });

    expect(datum.utc).toBe(1780000000000);
    expect(datum.status_code).toBe(1);
    expect(datum.layer_code).toBe(1);
    expect(datum.severity_code).toBe(1);
    expect(datum.branch_id).toBe('branch_main');
    expect(datum.summary).toBe('Core valid');
    expect(datum.raw.event_id).toBe('evt_1');
  });

  it('sorts normalized events by time and event identifier', () => {
    const events = normalizeEvents([
      { timestamp: 2, event_id: 'evt_b', status: 'valid', layer: 'core' },
      { timestamp: 1, event_id: 'evt_a', status: 'valid', layer: 'core' },
      { timestamp: 2, event_id: 'evt_a', status: 'valid', layer: 'core' }
    ]);

    expect(events.map((event) => event.event_id)).toEqual(['evt_a', 'evt_a', 'evt_b']);
  });
});
