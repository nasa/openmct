export default class FaultManagementAPI {
    constructor(openmct) {
        this.openmct = openmct;
        this.config = {};
    }

    acknowledgeFault(fault, ackData) {
        return this.faultActionProvider.acknowledgeFault(fault, ackData);
    }

    addHistoricalProvider(provider) {
        this.historicaFaultProvider = provider;
    }

    addRealtimeProvider(provider) {
        this.realtimeFaultProvider = provider;
    }

    addFaultActionProvider(provider) {
        this.faultActionProvider = provider;
    }

    request(domainObject) {
        if (!this.historicaFaultProvider?.supportsRequest(domainObject)) {
            return Promise.reject();
        }

        return this.historicaFaultProvider.request(domainObject);
    }

    setConfig(config) {
        this.config = config;
    }

    shelveFault(fault, shelveData) {
        return this.faultActionProvider.shelveFault(fault, shelveData);
    }

    subscribe(domainObject, callback) {
        if (!this.realtimeFaultProvider?.supportsSubscribe(domainObject)) {
            return Promise.reject();
        }

        return this.realtimeFaultProvider.subscribe(domainObject, callback);
    }
}
