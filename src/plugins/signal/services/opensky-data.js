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

/* global __SIGNAL_OPENSKY_RELAY_URL__, __SIGNAL_RELAY_AUTH_HEADER__, __SIGNAL_RELAY_SHARED_SECRET__ */

// Fetches military aircraft data from the Railway relay server.
// The relay handles OpenSky OAuth2 client credentials flow and caches
// bearer tokens for 30 minutes (§5.5 of the 35N Build Guide).
//
// Relay endpoint: GET /opensky
// Configure relay URL via window.__OPENSKY_RELAY_URL__ at runtime,
// or set OPENSKY_RELAY_URL build-time injection. Defaults to localhost.
//
// Callsign classification patterns from §7.1 of the 35N Build Guide.

const MILITARY_PATTERNS = {
  TRANSPORT: ['RCH', 'REACH', 'MOOSE', 'HERKY', 'EVAC', 'DUSTOFF', 'SPAR', 'BOXER'],
  FIGHTER: ['VIPER', 'EAGLE', 'RAPTOR', 'STRIKE', 'SWORD', 'DAGGER', 'TIGER'],
  RECCE: ['SIGNT', 'COBRA', 'RIVET', 'JSTARS', 'AWACS', 'COMPASS', 'SENIOR'],
  TANKER: ['POLO', 'DRACO', 'ZINC', 'SHELL']
};

function classifyCallsign(callsign) {
  if (!callsign) {
    return 'Military';
  }

  const cs = callsign.trim().toUpperCase();

  for (const [type, patterns] of Object.entries(MILITARY_PATTERNS)) {
    if (patterns.some((p) => cs.startsWith(p))) {
      return type;
    }
  }

  return 'Military';
}

// OpenSky state vector indices per API spec:
// [icao24, callsign, country, time_pos, last_contact, lon, lat,
//  baro_alt, on_ground, velocity, track, vert_rate, sensors,
//  geo_alt, squawk, spi, position_source]
function transformStateVector(state) {
  const [
    icao24,
    callsign,
    country,
    ,
    lastContact,
    longitude,
    latitude,
    baroAltitude,
    onGround,
    velocity,
    trueTrack
  ] = state;

  return {
    utc: lastContact ? lastContact * 1000 : Date.now(),
    icao24,
    callsign: callsign?.trim() || icao24,
    country,
    latitude,
    longitude,
    altitude: baroAltitude !== null ? Math.round(baroAltitude * 3.28084) : null, // m → ft
    velocity: velocity !== null ? Math.round(velocity * 1.94384) : null, // m/s → kts
    heading: trueTrack !== null ? Math.round(trueTrack) : null,
    onGround: Boolean(onGround),
    classification: classifyCallsign(callsign)
  };
}

function getRelayUrl() {
  if (typeof __SIGNAL_OPENSKY_RELAY_URL__ !== 'undefined' && __SIGNAL_OPENSKY_RELAY_URL__) {
    return __SIGNAL_OPENSKY_RELAY_URL__;
  }

  return (
    (typeof window !== 'undefined' && window.__OPENSKY_RELAY_URL__) ||
    'http://localhost:3004/opensky'
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

export async function fetchMilitaryFlights() {
  try {
    const relaySecret = getRelaySharedSecret();
    const headers = relaySecret
      ? {
          [getRelayAuthHeaderName()]: relaySecret
        }
      : {};

    const response = await fetch(getRelayUrl(), { headers });

    if (!response.ok) {
      throw new Error(`OpenSky relay error: ${response.status}`);
    }

    const data = await response.json();
    // Relay may pass through raw OpenSky response {time, states:[]} or a pre-filtered array
    const states = Array.isArray(data) ? data : data.states || [];

    return states
      .filter((s) => s[6] !== null && s[5] !== null) // must have position
      .map(transformStateVector)
      .sort((a, b) => (b.altitude || 0) - (a.altitude || 0));
  } catch {
    return [];
  }
}
