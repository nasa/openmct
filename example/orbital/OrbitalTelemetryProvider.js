/**
 * Orbital Telemetry Provider
 *
 * Provides real-time satellite position telemetry computed via SGP4 propagation.
 * Supports both request() for snapshots and subscribe() for live updates.
 */

export default class OrbitalTelemetryProvider {
  constructor(dataService) {
    this._dataService = dataService;
  }

  supportsRequest(domainObject) {
    return domainObject.type === 'orbital.satellite';
  }

  supportsSubscribe(domainObject) {
    return domainObject.type === 'orbital.satellite';
  }

  async request(domainObject, options) {
    const satId = domainObject.identifier.key;

    // Ensure the satellite data is loaded
    if (!this._dataService.getSatellite(satId)) {
      for (const group of this._dataService._groups.keys()) {
        await this._dataService.loadGroup(group);

        if (this._dataService.getSatellite(satId)) {
          break;
        }
      }
    }

    if (options && options.strategy === 'latest') {
      const telemetry = this._dataService.getTelemetry(satId);

      return telemetry ? [telemetry] : [];
    }

    // For historical requests, compute positions over the time range
    const start = options?.start || Date.now() - 60 * 60 * 1000;
    const end = options?.end || Date.now();
    const points = Math.min(options?.size || 100, 500);
    const step = (end - start) / points;
    const results = [];

    for (let t = start; t <= end; t += step) {
      const pos = this._dataService.computePosition(satId, new Date(t));

      if (pos) {
        const sat = this._dataService.getSatellite(satId);

        results.push({
          ...pos,
          name: sat ? sat.name : satId,
          noradId: sat ? sat.noradId : ''
        });
      }
    }

    return results;
  }

  subscribe(domainObject, callback) {
    const satId = domainObject.identifier.key;

    return this._dataService.subscribe(satId, callback);
  }
}
