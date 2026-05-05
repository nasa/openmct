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

import { makeKeyString } from '../../api/objects/object-utils.js';

(function () {
  function sortTelemetriesByDate(historicalTelemetriesPool, timeSystemKey) {
    const historicalTelemetryDateMap = new Map();

    historicalTelemetriesPool.forEach((historicalTelemetryList) => {
      const { historicalTelemetry, domainObject } = historicalTelemetryList;
      const { identifier } = domainObject;
      const telemetryIdentifier = makeKeyString(identifier);

      historicalTelemetry.forEach((historicalTelemetryItem) => {
        // Prefer the active time system key; fall back to `timestamp` only if needed.
        let telemetryTimestamp = historicalTelemetryItem?.[timeSystemKey];
        if (telemetryTimestamp === undefined && historicalTelemetryItem?.timestamp) {
          telemetryTimestamp = new Date(historicalTelemetryItem.timestamp)?.getTime();
        }

        if (!historicalTelemetryDateMap.get(telemetryTimestamp)) {
          const telemetryMap = new Map();
          telemetryMap.set(telemetryIdentifier, historicalTelemetryItem);
          historicalTelemetryDateMap.set(telemetryTimestamp, telemetryMap);
        } else {
          const telemetryMap = historicalTelemetryDateMap.get(telemetryTimestamp);
          telemetryMap.set(telemetryIdentifier, historicalTelemetryItem);
          historicalTelemetryDateMap.set(telemetryTimestamp, telemetryMap);
        }
      });
    });

    return historicalTelemetryDateMap;
  }

  self.onmessage = function (e) {
    const { type, data } = e.data;

    if (type === 'sortTelemetries') {
      const sortedTelemetries = sortTelemetriesByDate(
        data.historicalTelemetriesPool,
        data.timeSystemKey
      );
      self.postMessage({ type: 'result', data: sortedTelemetries });
    } else {
      self.postMessage({ type: 'error', error: 'Unknown message type' });
    }
  };
})();
