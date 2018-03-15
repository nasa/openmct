define([
    './SummaryWidgetEvaluator',
    '../../../../api/objects/object-utils'
], function (
    SummaryWidgetEvaluator,
    objectUtils
) {

    function EvaluatorPool(openmct) {
        this.openmct = openmct;
        this.byObjectId = {};
        this.byEvaluator = new WeakMap();
    }

    EvaluatorPool.prototype.get = function (domainObject) {
        var objectId = objectUtils.makeKeyString(domainObject);
        var poolEntry = this.byObjectId[objectId];
        if (!poolEntry) {
            poolEntry = {
                leases: 0,
                objectId: objectId,
                evaluator: new SummaryWidgetEvaluator(domainObject, this.openmct)
            };
            this.byEvaluator.set(poolEntry.evaluator, poolEntry);
            this.byObjectId[objectId] = poolEntry;
        }
        poolEntry.leases += 1;
        return poolEntry.evaluator;
    };

    EvaluatorPool.prototype.release = function (evaluator) {
        var poolEntry = this.byEvaluator.get(evaluator);
        poolEntry.leases -= 1;
        if (poolEntry.leases === 0) {
            evaluator.destroy();
            this.byEvaluator.delete(evaluator);
            delete this.byObjectId[poolEntry.objectId];
        }
    };

    return EvaluatorPool;
});
