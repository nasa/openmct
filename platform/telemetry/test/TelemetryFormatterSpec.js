/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/TelemetryFormatter"],
    function (TelemetryFormatter) {
        "use strict";

        describe("The telemetry formatter", function () {
            var formatter;

            beforeEach(function () {
                formatter = new TelemetryFormatter();
            });

            it("formats domains using YYYY-DDD style", function () {
                expect(formatter.formatDomainValue(402513731000)).toEqual(
                    "1982-276 17:22:11"
                );
            });

            it("formats ranges as values", function () {
                expect(formatter.formatRangeValue(10)).toEqual("10.000");
            });
        });
    }
);