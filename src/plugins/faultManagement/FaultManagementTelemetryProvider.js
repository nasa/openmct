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

    subscribe(domainObject, callback) {
        if (this.config.devMode) {
            let timerId = setInterval(() => {
                this._getTestData()
                    .then(faults => {
                        callback(faults.alarms[0]);
                    });
            }, this.config.devInterval);

            return () => {
                clearTimeout(timerId);
            };
        }

        callback({});

        return () => {
            console.log('unsubscribe');
        };
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
