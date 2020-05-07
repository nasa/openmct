export default class PlotlyTelemetryProvider {
    constructor(openmct) {
        this.openmct = openmct;
    }

    isTelemetryObject(domainObject) {
        return domainObject.type === 'plotlyPlot';
    }

    supportsRequest(domainObject) {
        return domainObject.type === 'plotlyPlot';
    }

    supportsSubscribe(domainObject) {
        return domainObject.type === 'plotlyPlot';
    }

    request(domainObject) {
        // let conditionManager = this.getConditionManager(domainObject);

        // return conditionManager.requestLADConditionSetOutput()
        //     .then(latestOutput => {
        //         return latestOutput;
        //     });
    }

    subscribe(domainObject, callback) {
        // let conditionManager = this.getConditionManager(domainObject);

        // conditionManager.on('conditionSetResultUpdated', callback);

        // return this.destroyConditionManager.bind(this, this.openmct.objects.makeKeyString(domainObject.identifier));
    }

}
