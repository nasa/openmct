export default class FaultManagementAPI {
    constructor(openmct) {
        this.openmct = openmct;
        this.config = {};
    }

    setConfig(config) {
        this.config = config;
    }

    addHistoricalProvider(provider) {
        console.log('API: addHistoricalProvider');
        this.historicaFaultProvider = provider;
    }

    addRealtimeProvider(provider) {
        console.log('API: addRealtimeProvider');
        this.realtimeFaultProvider = provider;
    }

    addFaultActionProvider(provider) {
        console.log('API: addFaultActionProvider');
        this.faultActionProvider = provider;
    }

    request(domainObject) {
        console.log('API: request');

        if (!this.historicaFaultProvider?.supportsRequest(domainObject)) {
            return Promise.reject();
        }

        return this.historicaFaultProvider.request(domainObject);
    }

    subscribe(domainObject, callback) {
        console.log('API: subscribe');

        if (!this.realtimeFaultProvider?.supportsSubscribe(domainObject)) {
            return Promise.reject();
        }

        return this.realtimeFaultProvider.subscribe(domainObject, callback);
    }

    acknowledgeFault(fault) {
        console.log('API: acknowledgeFault', fault);

        return this.faultActionProvider.acknowledgeFault(fault);
    }

    shelveFault(fault) {
        console.log('API: shelveFault', fault);

        return this.faultActionProvider.shelveFault(fault);
    }
}
