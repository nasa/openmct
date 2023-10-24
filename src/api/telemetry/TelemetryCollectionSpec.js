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

import { TIMESYSTEM_KEY_WARNING } from './constants';

describe('Telemetry Collection', () => {
  let openmct;
  let mockMetadataProvider;
  let mockMetadata = {};
  let domainObject;

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.on('start', done);

    domainObject = {
      identifier: {
        key: 'a',
        namespace: 'b'
      },
      type: 'sample-type'
    };

    mockMetadataProvider = {
      key: 'mockMetadataProvider',
      supportsMetadata() {
        return true;
      },
      getMetadata() {
        return mockMetadata;
      }
    };

    openmct.telemetry.addProvider(mockMetadataProvider);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState();
  });

  it('Warns if telemetry metadata does not match the active timesystem', () => {
    mockMetadata.values = [
      {
        key: 'foo',
        name: 'Bar',
        hints: {
          domain: 1
        }
      }
    ];

    const telemetryCollection = openmct.telemetry.requestCollection(domainObject);
    spyOn(telemetryCollection, '_warn');
    telemetryCollection.load();

    expect(telemetryCollection._warn).toHaveBeenCalledOnceWith(TIMESYSTEM_KEY_WARNING);
  });

  it('Does not warn if telemetry metadata matches the active timesystem', () => {
    mockMetadata.values = [
      {
        key: 'utc',
        name: 'Timestamp',
        format: 'utc',
        hints: {
          domain: 1
        }
      }
    ];

    const telemetryCollection = openmct.telemetry.requestCollection(domainObject);
    spyOn(telemetryCollection, '_warn');
    telemetryCollection.load();

    expect(telemetryCollection._warn).not.toHaveBeenCalled();
  });
});
