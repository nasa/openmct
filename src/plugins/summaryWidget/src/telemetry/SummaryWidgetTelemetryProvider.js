define([
    './EvaluatorPool'
], function (
    EvaluatorPool
) {

    function SummaryWidgetTelemetryProvider(openmct) {
        this.pool = new EvaluatorPool(openmct);
    }

    SummaryWidgetTelemetryProvider.prototype.supportsRequest = function (domainObject, options) {
        return domainObject.type === 'summary-widget' &&
            (options.strategy === 'latest' || options.size === 1);
    };

    SummaryWidgetTelemetryProvider.prototype.request = function (domainObject, options) {
        var evaluator = this.pool.get(domainObject);
        return evaluator.requestLatest(options)
            .then(function (latestDatum) {
                this.pool.release(evaluator);
                return [latestDatum];
            }.bind(this));
    };

    SummaryWidgetTelemetryProvider.prototype.supportsSubscribe = function (domainObject) {
        return domainObject.type === 'summary-widget';
    };

    SummaryWidgetTelemetryProvider.prototype.subscribe = function (domainObject, callback) {
        var evaluator = this.pool.get(domainObject);
        var unsubscribe = evaluator.subscribe(callback);
        return function () {
            this.pool.release(evaluator);
            unsubscribe();
        }.bind(this);
    };

    return SummaryWidgetTelemetryProvider;
});
