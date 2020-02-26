import ConditionManager from './ConditionManager'

export default class ConditionSetTelemetryProvider {
    constructor(openmct) {
        this.openmct = openmct;
    }
    isTelemetryObject(domainObject) {
        return domainObject.type === 'conditionSet';
    }

    supportsRequest(domainObject, options) {
        return false;
    }

    supportsSubscribe(domainObject) {
        return domainObject.type === 'conditionSet';
    }

    subscribe(domainObject, callback) {
        let conditionManager = new ConditionManager(domainObject, this.openmct);
        conditionManager.on('conditionSetResultUpdated', (output) => output);

        return function unsubscribe() {
            conditionManager.off('conditionSetResultUpdated');
        }
    }
}
