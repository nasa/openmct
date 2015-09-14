/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../src/TimelineFormatter'],
    function (TimelineFormatter) {
        'use strict';

        var SECOND = 1000,
            MINUTE = SECOND * 60,
            HOUR = MINUTE * 60,
            DAY = HOUR * 24;

        describe("The timeline formatter", function () {
            var formatter;

            beforeEach(function () {
                formatter = new TimelineFormatter();
            });

            it("formats durations with seconds", function () {
                expect(formatter.format(SECOND)).toEqual("000 00:00:01.000");
            });

            it("formats durations with milliseconds", function () {
                expect(formatter.format(SECOND + 42)).toEqual("000 00:00:01.042");
            });

            it("formats durations with days", function () {
                expect(formatter.format(3 * DAY + SECOND)).toEqual("003 00:00:01.000");
            });

            it("formats durations with hours", function () {
                expect(formatter.format(DAY + HOUR * 11 + SECOND)).toEqual("001 11:00:01.000");
            });

            it("formats durations with minutes", function () {
                expect(formatter.format(HOUR + MINUTE * 21)).toEqual("000 01:21:00.000");
            });
        });
    }
);