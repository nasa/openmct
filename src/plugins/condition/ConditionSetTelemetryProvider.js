import ConditionManager from './ConditionManager'

export default class ConditionSetTelemetryProvider {
    constructor(openmct) {
        this.openmct = openmct;
    }

    isTelemetryObject(domainObject) {
        return domainObject.type === 'conditionSet';
    }

    supportsRequest(domainObject) {
        return domainObject.type === 'conditionSet';
    }

    supportsSubscribe(domainObject) {
        return domainObject.type === 'conditionSet';
    }

    request(domainObject, options) {
        let conditionManager = new ConditionManager(domainObject, this.openmct);

        return conditionManager.requestLADConditionSetOutput()
            .then(latestOutput => {
                conditionManager.destroy();
                conditionManager = undefined;
                return latestOutput ? [latestOutput] : [];
            });
    }

    subscribe(domainObject, callback) {
        let conditionManager = new ConditionManager(domainObject, this.openmct);
        conditionManager.on('conditionSetResultUpdated', callback);

        return function unsubscribe() {
            conditionManager.off('conditionSetResultUpdated');
            conditionManager.destroy();
            conditionManager = undefined;
        };
    }
}
