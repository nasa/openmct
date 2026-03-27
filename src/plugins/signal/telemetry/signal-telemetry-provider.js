/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2026, United States Government
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

import { fetchAisVessels } from '../services/ais-data.js';
import { fetchEarthquakesInRange, fetchEarthquakesLastHour } from '../services/earthquake-data.js';
import { fetchEonetCategoryEvents } from '../services/eonet-data.js';
import { fetchGpsJammingEvents } from '../services/gpsjam-data.js';
import { fetchMilitaryFlights } from '../services/opensky-data.js';
import { getSignalModuleDefinition, isSignalModuleType } from '../types/signal-types.js';

const EARTHQUAKE_METADATA = {
  values: [
    {
      key: 'utc',
      name: 'Time',
      format: 'utc',
      hints: {
        domain: 1
      }
    },
    {
      key: 'magnitude',
      name: 'Magnitude',
      format: 'float',
      hints: {
        range: 1
      }
    },
    {
      key: 'depth',
      name: 'Depth (km)',
      format: 'float'
    },
    {
      key: 'latitude',
      name: 'Latitude',
      format: 'float'
    },
    {
      key: 'longitude',
      name: 'Longitude',
      format: 'float'
    },
    {
      key: 'place',
      name: 'Location',
      format: 'string'
    },
    {
      key: 'status',
      name: 'Status',
      format: 'string',
      hints: {
        range: 1
      }
    }
  ]
};

const EONET_METADATA = {
  values: [
    {
      key: 'utc',
      name: 'Time',
      format: 'utc',
      hints: {
        domain: 1
      }
    },
    {
      key: 'status',
      name: 'Status',
      format: 'string',
      hints: {
        range: 1
      }
    },
    {
      key: 'title',
      name: 'Event',
      format: 'string'
    },
    {
      key: 'source',
      name: 'Source',
      format: 'string'
    },
    {
      key: 'latitude',
      name: 'Latitude',
      format: 'float'
    },
    {
      key: 'longitude',
      name: 'Longitude',
      format: 'float'
    }
  ]
};
const GPS_JAM_METADATA = {
  values: [
    { key: 'utc', name: 'Date', format: 'utc', hints: { domain: 1 } },
    { key: 'classification', name: 'Severity', format: 'string', hints: { range: 1 } },
    { key: 'ratioPercent', name: 'Interference (%)', format: 'string' },
    { key: 'latitude', name: 'Latitude', format: 'float' },
    { key: 'longitude', name: 'Longitude', format: 'float' },
    { key: 'hex', name: 'H3 Hex', format: 'string' }
  ]
};

const OPENSKY_METADATA = {
  values: [
    { key: 'utc', name: 'Time', format: 'utc', hints: { domain: 1 } },
    { key: 'classification', name: 'Type', format: 'string', hints: { range: 1 } },
    { key: 'callsign', name: 'Callsign', format: 'string' },
    { key: 'country', name: 'Country', format: 'string' },
    { key: 'altitude', name: 'Altitude (ft)', format: 'float' },
    { key: 'velocity', name: 'Speed (kts)', format: 'float' },
    { key: 'latitude', name: 'Latitude', format: 'float' },
    { key: 'longitude', name: 'Longitude', format: 'float' }
  ]
};

const AIS_METADATA = {
  values: [
    { key: 'utc', name: 'Time', format: 'utc', hints: { domain: 1 } },
    { key: 'status', name: 'Status', format: 'string', hints: { range: 1 } },
    { key: 'name', name: 'Vessel', format: 'string' },
    { key: 'flag', name: 'Flag', format: 'string' },
    { key: 'speed', name: 'Speed (kts)', format: 'float' },
    { key: 'heading', name: 'Heading (°)', format: 'float' },
    { key: 'latitude', name: 'Latitude', format: 'float' },
    { key: 'longitude', name: 'Longitude', format: 'float' }
  ]
};
function isSignalElement(domainObject) {
  return isSignalModuleType(domainObject?.type);
}

function getMetadata(domainObject) {
  const moduleDefinition = getSignalModuleDefinition(domainObject?.type);
  const source = moduleDefinition?.source;

  if (source === 'eonet') {
    return EONET_METADATA;
  }
  if (source === 'gpsjam') {
    return GPS_JAM_METADATA;
  }
  if (source === 'opensky') {
    return OPENSKY_METADATA;
  }
  if (source === 'ais') {
    return AIS_METADATA;
  }

  return EARTHQUAKE_METADATA;
}

function requestSignalData(domainObject, options = {}) {
  const moduleDefinition = getSignalModuleDefinition(domainObject?.type);
  const { start, end } = options;
  const source = moduleDefinition?.source;

  if (source === 'eonet') {
    return fetchEonetCategoryEvents(moduleDefinition.eonetCategory);
  }
  if (source === 'gpsjam') {
    return fetchGpsJammingEvents();
  }
  if (source === 'opensky') {
    return fetchMilitaryFlights();
  }
  if (source === 'ais') {
    return fetchAisVessels();
  }

  if (start && end) {
    return fetchEarthquakesInRange(new Date(start).toISOString(), new Date(end).toISOString());
  }

  return fetchEarthquakesLastHour();
}

export function installSignalTelemetryProvider(openmct) {
  // Cache for subscription callbacks (for polling simulation)
  const subscriptionCallbacks = new Map();

  openmct.telemetry.addProvider({
    supportsMetadata(domainObject) {
      return isSignalElement(domainObject);
    },
    getMetadata(domainObject) {
      return getMetadata(domainObject);
    },
    supportsRequest(domainObject) {
      return isSignalElement(domainObject);
    },
    request(domainObject, options = {}) {
      return requestSignalData(domainObject, options);
    },
    supportsSubscribe(domainObject) {
      return isSignalElement(domainObject);
    },
    subscribe(domainObject, callback) {
      // Store the callback for periodic polling
      const callbackId = Math.random().toString(36);
      subscriptionCallbacks.set(callbackId, { callback, domainObject });

      // Poll for new module data every 30 seconds.
      const pollInterval = window.setInterval(async () => {
        const data = await requestSignalData(domainObject);
        if (data.length > 0) {
          callback(data[0]);
        }
      }, 30000);

      // Return unsubscribe function
      return function unsubscribe() {
        window.clearInterval(pollInterval);
        subscriptionCallbacks.delete(callbackId);
      };
    }
  });
}
