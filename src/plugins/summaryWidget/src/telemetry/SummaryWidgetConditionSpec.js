define([
    './SummaryWidgetCondition'
], function (
    SummaryWidgetCondition
) {

    describe('SummaryWidgetCondition', function () {
        var condition;
        var telemetryState;

        beforeEach(function () {
            // Format map intentionally uses different keys than those present
            // in datum, which serves to verify conditions use format map to get
            // data.
            var formatMap = {
                adjusted: {
                    parse: function (datum) {
                        return datum.value + 10;
                    }
                },
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

        it('can evaluate if a single object matches', function () {
            condition = new SummaryWidgetCondition({
                object: 'objectId',
                key: 'raw',
                operation: 'greaterThan',
                values: [
                    10
                ]
            });
            telemetryState.objectId.lastDatum.value = 5;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(true);
        });

        it('can evaluate if a single object matches (alternate keys)', function () {
            condition = new SummaryWidgetCondition({
                object: 'objectId',
                key: 'adjusted',
                operation: 'greaterThan',
                values: [
                    10
                ]
            });
            telemetryState.objectId.lastDatum.value = -5;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 5;
            expect(condition.evaluate(telemetryState)).toBe(true);
        });

        it('can evaluate "if all objects match"', function () {
            condition = new SummaryWidgetCondition({
                object: 'all',
                key: 'raw',
                operation: 'greaterThan',
                values: [
                    10
                ]
            });
            telemetryState.objectId.lastDatum.value = 0;
            telemetryState.otherObjectId.lastDatum.value = 0;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 0;
            telemetryState.otherObjectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 0;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(true);
        });

        it('can evalute "if any object matches"', function () {
            condition = new SummaryWidgetCondition({
                object: 'any',
                key: 'raw',
                operation: 'greaterThan',
                values: [
                    10
                ]
            });
            telemetryState.objectId.lastDatum.value = 0;
            telemetryState.otherObjectId.lastDatum.value = 0;
            expect(condition.evaluate(telemetryState)).toBe(false);
            telemetryState.objectId.lastDatum.value = 0;
            telemetryState.otherObjectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(true);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 0;
            expect(condition.evaluate(telemetryState)).toBe(true);
            telemetryState.objectId.lastDatum.value = 15;
            telemetryState.otherObjectId.lastDatum.value = 15;
            expect(condition.evaluate(telemetryState)).toBe(true);
        });

    });
});
