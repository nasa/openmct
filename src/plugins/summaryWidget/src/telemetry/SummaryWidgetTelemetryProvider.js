define([
    './SummaryWidgetEvaluator'
], function (
    SummaryWidgetEvaluator
) {

    function SummaryWidgetTelemetryProvider(openmct) {
        this.openmct = openmct;
    }

    SummaryWidgetTelemetryProvider.prototype.supportsRequest = function (domainObject, options) {
        return domainObject.type === 'summary-widget' &&
            (options.strategy === 'latest' || options.size === 1);
    };

    SummaryWidgetTelemetryProvider.prototype.request = function (domainObject, options) {
        var evaluator = new SummaryWidgetEvaluator(domainObject, this.openmct);
        return evaluator.requestLatest(options)
            .then(function (latestDatum) {
                return [latestDatum];
            });
    };

    SummaryWidgetTelemetryProvider.prototype.supportsSubscribe = function (domainObject) {
        return domainObject.type === 'summary-widget';
    };

    SummaryWidgetTelemetryProvider.prototype.subscribe = function (domainObject, callback) {
        var evaluator = new SummaryWidgetEvaluator(domainObject, this.openmct);
        return evaluator.subscribe(callback);
    };

    return SummaryWidgetTelemetryProvider;
});
