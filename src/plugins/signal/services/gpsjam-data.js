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

// Direct fetch from GPSJam.org H3 hex API.
// In production this will be routed through the Vercel edge function
// (gpsjam service domain, GetGpsJammingHexes RPC) which reads from Redis.
// Classification thresholds from §7.3 of the 35N Build Guide:
//   Low:    0–2%   → hidden (too noisy)
//   Medium: 2–10%  → amber
//   High:   >10%   → red

const GPSJAM_API_BASE = 'https://gpsjam.org/geo.json';

function transformHex(feature) {
  const props = feature.properties;
  const ratio = props.bad_ratio ?? props.bad_aircraft_ratio ?? 0;

  return {
    utc: feature.properties.date
      ? new Date(feature.properties.date + 'T12:00:00Z').getTime()
      : Date.now(),
    hex: feature.id || null,
    ratio,
    ratioPercent: (ratio * 100).toFixed(1),
    classification: ratio >= 0.1 ? 'High' : 'Medium',
    latitude: feature.geometry?.coordinates?.[1] ?? null,
    longitude: feature.geometry?.coordinates?.[0] ?? null
  };
}

export async function fetchGpsJammingEvents() {
  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await fetch(`${GPSJAM_API_BASE}?lat=0&lon=0&z=2&date=${today}`);

    if (!response.ok) {
      throw new Error(`GPSJam API error: ${response.status}`);
    }

    const geojson = await response.json();

    return geojson.features
      .filter((f) => {
        const ratio = f.properties.bad_ratio ?? f.properties.bad_aircraft_ratio ?? 0;
        return ratio >= 0.02; // Suppress low-noise hexes per build guide
      })
      .map(transformHex)
      .sort((a, b) => b.ratio - a.ratio);
  } catch {
    return [];
  }
}
