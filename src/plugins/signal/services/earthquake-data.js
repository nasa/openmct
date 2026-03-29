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

// USGS Earthquake API endpoint
const USGS_API_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';

/**
 * Transform USGS GeoJSON earthquake feature to Open MCT telemetry format
 * @param {Object} feature GeoJSON feature from USGS API
 * @returns {Object} Telemetry datum with utc and status fields
 */
function transformEarthquakeDatum(feature) {
  const props = feature.properties;
  const coords = feature.geometry.coordinates;

  const magnitude = props.mag;
  let statusLabel;
  if (magnitude >= 5.0) {
    statusLabel = 'High';
  } else if (magnitude >= 3.0) {
    statusLabel = 'Medium';
  } else {
    statusLabel = 'Low';
  }

  return {
    utc: props.time,
    timestamp: props.time,
    magnitude: props.mag,
    depth: coords[2],
    latitude: coords[1],
    longitude: coords[0],
    place: props.place,
    url: props.url,
    status: statusLabel
  };
}

/**
 * Fetch earthquakes from USGS in the past hour
 * @returns {Promise<Array>} Array of telemetry data points
 */
export async function fetchEarthquakesLastHour() {
  try {
    const response = await fetch(`${USGS_API_BASE}/all_hour.geojson`);
    if (!response.ok) {
      throw new Error(`USGS API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform GeoJSON features to telemetry format and sort by time descending
    return data.features.map(transformEarthquakeDatum).sort((a, b) => b.utc - a.utc);
  } catch (error) {
    console.error('Failed to fetch earthquake data:', error);
    return [];
  }
}

/**
 * Fetch earthquakes from USGS matching a magnitude range
 * @param {string} startTime ISO timestamp for start
 * @param {string} endTime ISO timestamp for end
 * @returns {Promise<Array>} Array of telemetry data points
 */
export async function fetchEarthquakesInRange(startTime, endTime) {
  try {
    const url = new URL(`${USGS_API_BASE}/all_hour.geojson`);
    url.searchParams.append('starttime', startTime);
    url.searchParams.append('endtime', endTime);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`USGS API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.features.map(transformEarthquakeDatum).sort((a, b) => b.utc - a.utc);
  } catch (error) {
    console.error('Failed to fetch earthquake data:', error);
    return [];
  }
}

/**
 * Get earthquake count and magnitude summary (for dashboard)
 * @returns {Promise<Object>} Summary statistics
 */
export async function getEarthquakeSummary() {
  try {
    const data = await fetchEarthquakesLastHour();
    const magnitudes = data.map((d) => d.magnitude);

    return {
      count: data.length,
      maxMagnitude: magnitudes.length > 0 ? Math.max(...magnitudes) : 0,
      avgMagnitude:
        magnitudes.length > 0
          ? (magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length).toFixed(2)
          : 0,
      highRiskCount: data.filter((d) => d.magnitude >= 5.0).length,
      mediumRiskCount: data.filter((d) => d.magnitude >= 3.0 && d.magnitude < 5.0).length,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get earthquake summary:', error);
    return {
      count: 0,
      maxMagnitude: 0,
      avgMagnitude: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lastUpdate: new Date().toISOString()
    };
  }
}
