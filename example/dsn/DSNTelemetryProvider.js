/**
 * DSN Telemetry Provider
 * Provides real-time and historical telemetry data for DSN dishes.
 * Supports both request() (snapshot) and subscribe() (live updates).
 */

export default class DSNTelemetryProvider {
  constructor(dataService) {
    this._dataService = dataService;
  }

  supportsRequest(domainObject) {
    return domainObject.type === 'dsn.dish';
  }

  supportsSubscribe(domainObject) {
    return domainObject.type === 'dsn.dish';
  }

  async request(domainObject) {
    const dishName = domainObject.identifier.key.replace('dish-', '');

    if (!this._dataService.getLatestData()) {
      try {
        const data = await this._dataService.fetchData();
        this._dataService._latestData = data;
        await this._dataService._loadConfig();
      } catch (error) {
        console.warn('DSN: Failed to fetch initial data:', error);

        return [];
      }
    }

    const telemetry = this._dataService.getDishTelemetry(dishName);

    if (!telemetry) {
      return [];
    }

    return [telemetry];
  }

  subscribe(domainObject, callback) {
    const dishName = domainObject.identifier.key.replace('dish-', '');

    return this._dataService.subscribe(dishName, callback);
  }
}
