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
        console.log('TODO subscribe', domainObject);
        callback({});
    }

    request(domainObject, options) {
        return fetch(this.config.url)
            .then(res => res.json());
    }
}
