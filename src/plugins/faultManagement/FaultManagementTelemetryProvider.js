import { FAULT_MANAGEMENT_VIEW } from './constants';

export default class FaultManagementTelemetryProvider {
    constructor(openmct, config) {
        this.openmct = openmct;
        this.config = config;
    }

    supportsRequest(domainObject) {
        return domainObject.type === FAULT_MANAGEMENT_VIEW;
    }

    supportsSubscribe(domainObject) {
        return domainObject.type === FAULT_MANAGEMENT_VIEW;
    }

    subscribe(domainObject, callback) {
        console.log('TODO subscribe', domainObject);
        callback({});
    }

    request(domainObject, options) {
        console.log('TODO request', domainObject);

        return Promise.resolve({});
    }
}
