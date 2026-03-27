/**
 * Orbital Object Provider
 *
 * Provides domain objects for the orbital hierarchy:
 * Orbital Tracking (root) > Satellite Groups > Individual Satellites
 */

import { SATELLITE_GROUPS } from './OrbitalDataService.js';

const ORBITAL_NAMESPACE = 'orbital';

export default class OrbitalObjectProvider {
  constructor(dataService) {
    this._dataService = dataService;
  }

  async get(identifier) {
    if (identifier.key === 'root') {
      return {
        identifier,
        name: 'Orbital Tracking',
        type: 'orbital.root',
        location: 'ROOT'
      };
    }

    if (identifier.key.startsWith('group-')) {
      const groupKey = identifier.key.replace('group-', '');
      const group = SATELLITE_GROUPS.find((g) => g.key === groupKey);

      return {
        identifier,
        name: group ? group.name : groupKey,
        type: 'orbital.group',
        location: `${ORBITAL_NAMESPACE}:root`,
        orbital: { groupKey }
      };
    }

    if (identifier.key.startsWith('sat-')) {
      // Need to find which group this satellite belongs to and load it
      await this._ensureSatelliteLoaded(identifier.key);
      const sat = this._dataService.getSatellite(identifier.key);

      return {
        identifier,
        name: sat ? sat.name : identifier.key,
        type: 'orbital.satellite',
        telemetry: {
          values: getSatelliteTelemetryMetadata()
        },
        orbital: {
          noradId: sat ? sat.noradId : ''
        }
      };
    }

    return undefined;
  }

  async _ensureSatelliteLoaded(satId) {
    if (this._dataService.getSatellite(satId)) {
      return;
    }

    // Try loading each group until we find the satellite
    for (const group of SATELLITE_GROUPS) {
      await this._dataService.loadGroup(group.key);

      if (this._dataService.getSatellite(satId)) {
        return;
      }
    }
  }
}

export function getSatelliteTelemetryMetadata() {
  return [
    {
      key: 'timestamp',
      name: 'Timestamp',
      format: 'utc',
      hints: { domain: 1 }
    },
    {
      key: 'name',
      name: 'Satellite',
      format: 'string',
      hints: { label: 1 }
    },
    {
      key: 'latitude',
      name: 'Latitude (°)',
      format: 'number',
      formatString: '%0.4f',
      hints: { range: 2 }
    },
    {
      key: 'longitude',
      name: 'Longitude (°)',
      format: 'number',
      formatString: '%0.4f',
      hints: { range: 3 }
    },
    {
      key: 'altitude',
      name: 'Altitude (km)',
      format: 'number',
      formatString: '%0.1f',
      hints: { range: 1 }
    },
    {
      key: 'speed',
      name: 'Speed (km/s)',
      format: 'number',
      formatString: '%0.3f',
      hints: { range: 4 }
    }
  ];
}

export { ORBITAL_NAMESPACE };
