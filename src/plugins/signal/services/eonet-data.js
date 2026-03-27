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

const EONET_API_BASE = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open';

function transformEonetDatum(event) {
  const latestGeometry = event.geometry?.[event.geometry.length - 1];
  const coordinates = latestGeometry?.coordinates || [0, 0];
  const sources = event.sources || [];

  return {
    utc: latestGeometry?.date ? new Date(latestGeometry.date).getTime() : Date.now(),
    title: event.title,
    source: sources.map((source) => source.id).join(', ') || 'EONET',
    sourceUrl: sources[0]?.url,
    latitude: coordinates[1] || 0,
    longitude: coordinates[0] || 0,
    status: event.closed ? 'Closed' : 'Active'
  };
}

export async function fetchEonetCategoryEvents(category) {
  try {
    const response = await fetch(`${EONET_API_BASE}&category=${category}`);
    if (!response.ok) {
      throw new Error(`EONET API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.events.map(transformEonetDatum).sort((a, b) => b.utc - a.utc);
  } catch (error) {
    console.error(`Failed to fetch EONET category data for ${category}:`, error);
    return [];
  }
}
