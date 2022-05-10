import { FAULT_MANAGEMENT_TYPE } from './constants';

export default class FaultManagementTelemetryProvider {
    constructor(openmct, config) {
        this.openmct = openmct;
        this.config = config;
    }

    supportsRequest(domainObject) {
        return domainObject.type === FAULT_MANAGEMENT_TYPE;
    }

    supportsSubscribe(domainObject) {
        return domainObject.type === FAULT_MANAGEMENT_TYPE;
    }

    request(domainObject, options) {
        if (this.config.devMode) {
            return this._getTestData();
        }

        return fetch(this.config.url)
            .then(res => res.json());
    }

    _getTestData() {
        const faults = localStorage.getItem('faults') || '{}';

        return Promise.resolve(JSON.parse(faults));
    }
}
