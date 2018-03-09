define([
    './SummaryWidgetEvaluator'
], function (
    SummaryWidgetEvaluator
) {
    function SummaryWidgetTelemetryProvider(openmct) {
        this.openmct = openmct;
    }

    SummaryWidgetTelemetryProvider.prototype.supportsRequest = function (options, domainObject) {
        return false;
    };

    SummaryWidgetTelemetryProvider.prototype.supportsSubscribe = function (domainObject) {
        return domainObject.type === 'summary-widget';
    };

    SummaryWidgetTelemetryProvider.prototype.subscribe = function (domainObject, callback) {
        var evaluator = new SummaryWidgetEvaluator(domainObject, this.openmct, callback);
        return function unsubscribe() {
            evaluator.destroy();
        };
    };

    return SummaryWidgetTelemetryProvider;
});
