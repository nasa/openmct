/**
 * Orbital Composition Provider
 *
 * Defines parent-child relationships:
 * - Root → Satellite Groups (Space Stations, GPS, Weather, etc.)
 * - Group → Individual Satellites
 */

import { SATELLITE_GROUPS } from './OrbitalDataService.js';
import { ORBITAL_NAMESPACE } from './OrbitalObjectProvider.js';

export default class OrbitalCompositionProvider {
  constructor(dataService) {
    this._dataService = dataService;
  }

  appliesTo(domainObject) {
    return domainObject.type === 'orbital.root' || domainObject.type === 'orbital.group';
  }

  async load(domainObject) {
    if (domainObject.type === 'orbital.root') {
      return SATELLITE_GROUPS.map((g) => ({
        namespace: ORBITAL_NAMESPACE,
        key: `group-${g.key}`
      }));
    }

    if (domainObject.type === 'orbital.group') {
      const groupKey = domainObject.orbital?.groupKey;

      if (!groupKey) {
        return [];
      }

      await this._dataService.loadGroup(groupKey);
      const satellites = this._dataService.getSatellitesInGroup(groupKey);

      return satellites.map((sat) => ({
        namespace: ORBITAL_NAMESPACE,
        key: sat.id
      }));
    }

    return [];
  }
}
