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

/* global __SIGNAL_AIS_RELAY_URL__, __SIGNAL_RELAY_AUTH_HEADER__, __SIGNAL_RELAY_SHARED_SECRET__ */

// Fetches a vessel snapshot from the Railway relay server.
// The relay maintains a persistent WebSocket to AISStream.io and
// multiplexes it to all browser clients (§7.2 of the 35N Build Guide).
// The snapshot is updated every 10 seconds on the relay side.
//
// Relay endpoint: GET /ais/snapshot
// Configure relay URL via window.__AIS_RELAY_URL__ at runtime.
// Defaults to localhost for development.

function transformVessel(vessel) {
  return {
    utc: vessel.timestamp ? vessel.timestamp * 1000 : Date.now(),
    mmsi: vessel.mmsi,
    name: vessel.name || vessel.mmsi || 'Unknown',
    latitude: vessel.latitude ?? vessel.lat ?? null,
    longitude: vessel.longitude ?? vessel.lon ?? null,
    heading: vessel.heading ?? null,
    speed: vessel.speed ?? vessel.sog ?? null,
    status: vessel.status || vessel.navigationalStatus || 'Unknown',
    flag: vessel.flag || vessel.country || null
  };
}

function getRelayUrl() {
  if (typeof __SIGNAL_AIS_RELAY_URL__ !== 'undefined' && __SIGNAL_AIS_RELAY_URL__) {
    return __SIGNAL_AIS_RELAY_URL__;
  }

  return (
    (typeof window !== 'undefined' && window.__AIS_RELAY_URL__) ||
    'http://localhost:3004/ais/snapshot'
  );
}

function getRelayAuthHeaderName() {
  if (typeof __SIGNAL_RELAY_AUTH_HEADER__ !== 'undefined' && __SIGNAL_RELAY_AUTH_HEADER__) {
    return __SIGNAL_RELAY_AUTH_HEADER__;
  }

  return (typeof window !== 'undefined' && window.__RELAY_AUTH_HEADER__) || 'x-relay-key';
}

function getRelaySharedSecret() {
  if (typeof __SIGNAL_RELAY_SHARED_SECRET__ !== 'undefined' && __SIGNAL_RELAY_SHARED_SECRET__) {
    return __SIGNAL_RELAY_SHARED_SECRET__;
  }

  return (typeof window !== 'undefined' && window.__RELAY_SHARED_SECRET__) || '';
}

export async function fetchAisVessels() {
  try {
    const relaySecret = getRelaySharedSecret();
    const headers = relaySecret
      ? {
          [getRelayAuthHeaderName()]: relaySecret
        }
      : {};

    const response = await fetch(getRelayUrl(), { headers });

    if (!response.ok) {
      throw new Error(`AIS relay error: ${response.status}`);
    }

    const data = await response.json();
    // Relay may return an array, {vessels: [...]} object, or MMSI-keyed map
    let vessels;
    if (Array.isArray(data)) {
      vessels = data;
    } else if (data.vessels) {
      vessels = Object.values(data.vessels);
    } else {
      vessels = Object.values(data);
    }

    return vessels
      .map(transformVessel)
      .filter((v) => v.latitude !== null && v.longitude !== null)
      .sort((a, b) => b.utc - a.utc)
      .slice(0, 100);
  } catch {
    return [];
  }
}
