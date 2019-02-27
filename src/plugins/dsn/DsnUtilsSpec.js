
define([
    './DsnUtils'
], function (
    DsnUtils
) {
    'use strict';

    describe('DsnUtils', function () {
        it('deserializes a domain object identifier', function () {
            var identifier = DsnUtils.deserializeIdentifier('deep.space.network:canberra');
            expect(identifier.namespace).toBe('deep.space.network');
            expect(identifier.key).toBe('canberra');
        });

        it('serializes a domain object identifier', function () {
            var identifer = DsnUtils.serializeIdentifier({
                namespace: 'deep.space.network',
                key: 'madrid'
            });

            expect(identifer).toBe('deep.space.network:madrid');
        });

        describe('parses telemetry', function () {
            var downSignal;

            beforeEach(function () {
                downSignal = document.createElement('downSignal');
            });

            it('as a float', function () {
                var dataRate;

                downSignal.setAttribute('dataRate', '160.002853');
                dataRate = DsnUtils.parseTelemetryAsFloatOrString(downSignal, 'dataRate');
                expect(dataRate).toBe(160.002853);
            });

            it('as a string when a float can not be parsed', function () {
                var dataRate,
                    frequency,
                    power;

                downSignal.setAttribute('dataRate', '');
                downSignal.setAttribute('frequency', ' ');
                downSignal.setAttribute('power', 'none');

                dataRate = DsnUtils.parseTelemetryAsFloatOrString(downSignal, 'dataRate');
                frequency = DsnUtils.parseTelemetryAsFloatOrString(downSignal, 'frequency');
                power = DsnUtils.parseTelemetryAsFloatOrString(downSignal, 'power');

                expect(dataRate).toBe('');
                expect(frequency).toBe(' ');
                expect(power).toBe('none');
            });
        });
    });
});
