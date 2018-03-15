define([
    './SummaryWidgetRule'
], function (
    SummaryWidgetRule
) {
    describe('SummaryWidgetRule', function () {

        var rule;
        var telemetryState;

        beforeEach(function () {
            var formatMap = {
                raw: {
                    parse: function (datum) {
                        return datum.value;
                    }
                }
            };

            telemetryState = {
                objectId: {
                    formats: formatMap,
                    lastDatum: {
                    }
                },
                otherObjectId: {
                    formats: formatMap,
                    lastDatum: {
                    }
                }
            };
        });

        it('allows single condition rules with any', function () {
            rule = new SummaryWidgetRule({
                trigger: 'any',
                conditions: [{
                    object: 'objectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        10
                    ]
                }]
            });

            telemetryState.objectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            expect(rule.evaluate(telemetryState)).toBe(true);
        });

        it('allows single condition rules with all', function () {
            rule = new SummaryWidgetRule({
                trigger: 'all',
                conditions: [{
                    object: 'objectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        10
                    ]
                }]
            });

            telemetryState.objectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            expect(rule.evaluate(telemetryState)).toBe(true);
        });

        it('can combine multiple conditions with all', function () {
            rule = new SummaryWidgetRule({
                trigger: 'all',
                conditions: [{
                    object: 'objectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        10
                    ]
                }, {
                    object: 'otherObjectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        20
                    ]
                }]
            });

            telemetryState.objectId.lastDatum.value = 5;
            telemetryState.otherObjectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 5;
            telemetryState.otherObjectId.lastDatum.value = 25;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 25;
            expect(rule.evaluate(telemetryState)).toBe(true);

        });

        it('can combine multiple conditions with any', function () {
            rule = new SummaryWidgetRule({
                trigger: 'any',
                conditions: [{
                    object: 'objectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        10
                    ]
                }, {
                    object: 'otherObjectId',
                    key: 'raw',
                    operation: 'greaterThan',
                    values: [
                        20
                    ]
                }]
            });

            telemetryState.objectId.lastDatum.value = 5;
            telemetryState.otherObjectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 5;
            telemetryState.otherObjectId.lastDatum.value = 25;
            expect(rule.evaluate(telemetryState)).toBe(true);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 5;
            expect(rule.evaluate(telemetryState)).toBe(true);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 25;
            expect(rule.evaluate(telemetryState)).toBe(true);
        });
    });
});
