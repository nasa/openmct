/**
 * DSN Composition Provider
 * Defines the parent-child relationships in the DSN object tree.
 * - DSN Network root → 3 Stations
 * - Each Station → its Dishes (discovered dynamically from live data)
 */

import { DSN_NAMESPACE, STATIONS } from './DSNObjectProvider.js';

const STATION_DISHES = {
  gdscc: ['DSS14', 'DSS24', 'DSS25', 'DSS26'],
  mdscc: ['DSS53', 'DSS54', 'DSS55', 'DSS56', 'DSS63', 'DSS65'],
  cdscc: ['DSS34', 'DSS35', 'DSS36', 'DSS43']
};

export default class DSNCompositionProvider {
  constructor(dataService) {
    this._dataService = dataService;
  }

  appliesTo(domainObject) {
    return domainObject.type === 'dsn.network' || domainObject.type === 'dsn.station';
  }

  load(domainObject) {
    if (domainObject.type === 'dsn.network') {
      return Promise.resolve(
        STATIONS.map((s) => ({
          namespace: DSN_NAMESPACE,
          key: `station-${s.key}`
        }))
      );
    }

    if (domainObject.type === 'dsn.station') {
      const stationKey = domainObject.dsn?.stationKey;
      const dishes = STATION_DISHES[stationKey] || [];

      const liveData = this._dataService.getLatestData();

      if (liveData) {
        const liveDishes = Object.values(liveData.dishes)
          .filter((d) => d.station === stationKey)
          .map((d) => d.name);

        if (liveDishes.length > 0) {
          const allDishes = [...new Set([...dishes, ...liveDishes])];

          return Promise.resolve(
            allDishes.map((name) => ({
              namespace: DSN_NAMESPACE,
              key: `dish-${name}`
            }))
          );
        }
      }

      return Promise.resolve(
        dishes.map((name) => ({
          namespace: DSN_NAMESPACE,
          key: `dish-${name}`
        }))
      );
    }

    return Promise.resolve([]);
  }
}
