/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ["../../src/controllers/TimerFormatter"],
    function (TimerFormatter) {
        "use strict";

        var MS_IN_SEC = 1000,
            MS_IN_MIN = MS_IN_SEC * 60,
            MS_IN_HR = MS_IN_MIN * 60,
            MS_IN_DAY = MS_IN_HR * 24;

        describe("The timer value formatter", function () {
            var formatter = new TimerFormatter();

            function sum(a, b) {
                return a + b;
            }

            function toDuration(days, hours, mins, secs) {
                return [
                    days * MS_IN_DAY,
                    hours * MS_IN_HR,
                    mins * MS_IN_MIN,
                    secs * MS_IN_SEC
                ].reduce(sum, 0);
            }

            function twoDigits(n) {
                return n < 10 ? ('0' + n) : n;
            }

            it("formats short-form values (no days)", function () {
                expect(formatter.short(toDuration(0, 123, 2, 3) + 123))
                    .toEqual("123:02:03");
            });

            it("formats negative short-form values (no days)", function () {
                expect(formatter.short(-toDuration(0, 123, 2, 3) + 123))
                    .toEqual("123:02:03");
            });

            it("formats long-form values (with days)", function () {
                expect(formatter.long(toDuration(0, 123, 2, 3) + 123))
                    .toEqual("5D 03:02:03");
            });

            it("formats negative long-form values (no days)", function () {
                expect(formatter.long(-toDuration(0, 123, 2, 3) + 123))
                    .toEqual("5D 03:02:03");
            });

            it("rounds seconds down for positive durations", function () {
                expect(formatter.short(MS_IN_SEC + 600))
                    .toEqual("00:00:01");
            });

            it("rounds seconds up for negative durations", function () {
                expect(formatter.short(-MS_IN_SEC - 600))
                    .toEqual("00:00:02");
            });

            it("short-formats correctly around negative time borders", function () {
                expect(formatter.short(-1)).toEqual("00:00:01");
                expect(formatter.short(-1000)).toEqual("00:00:01");
                expect(formatter.short(-1001)).toEqual("00:00:02");
                expect(formatter.short(-2000)).toEqual("00:00:02");
                expect(formatter.short(-59001)).toEqual("00:01:00");
                expect(formatter.short(-60000)).toEqual("00:01:00");

                expect(formatter.short(-MS_IN_HR + 999)).toEqual("01:00:00");
                expect(formatter.short(-MS_IN_HR)).toEqual("01:00:00");
            });

            it("differentiates between values around zero", function () {
                // These are more than 1000 ms apart so should not appear
                // as the same second
                expect(formatter.short(-999))
                    .not.toEqual(formatter.short(999));
            });

            it("handles negative days", function () {
                expect(formatter.long(-10 * MS_IN_DAY))
                    .toEqual("10D 00:00:00");
                expect(formatter.long(-10 * MS_IN_DAY + 100))
                    .toEqual("10D 00:00:00");
                expect(formatter.long(-10 * MS_IN_DAY + 999))
                    .toEqual("10D 00:00:00");

                expect(formatter.short(-10 * MS_IN_DAY + 100))
                    .toEqual("240:00:00");
            });

        });
    }
);
