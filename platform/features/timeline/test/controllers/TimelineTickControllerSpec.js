/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/controllers/TimelineTickController', '../../src/TimelineFormatter'],
    function (TimelineTickController, TimelineFormatter) {
        'use strict';

        var BILLION = 1000000000,
            FORMATTER = new TimelineFormatter();

        describe("The timeline tick controller", function () {
            var mockToMillis,
                controller;

            function expectedTick(pixelValue) {
                return {
                    left: pixelValue,
                    text: FORMATTER.format(pixelValue * 2 + BILLION)
                };
            }

            beforeEach(function () {
                mockToMillis = jasmine.createSpy('toMillis');
                mockToMillis.andCallFake(function (v) {
                    return v * 2 + BILLION;
                });
                controller = new TimelineTickController();
            });

            it("exposes tick marks within a requested pixel span", function () {
                // Simple case
                expect(controller.labels(8000, 300, 100, mockToMillis))
                    .toEqual([8000, 8100, 8200, 8300].map(expectedTick));

                // Slightly more complicated case
                expect(controller.labels(7480, 4500, 1000, mockToMillis))
                    .toEqual([7000, 8000, 9000, 10000, 11000, 12000].map(expectedTick));
            });

            it("does not rebuild arrays for same inputs", function () {
                var firstValue = controller.labels(800, 300, 100, mockToMillis);

                expect(controller.labels(800, 300, 100, mockToMillis))
                    .toEqual(firstValue);

                expect(controller.labels(800, 300, 100, mockToMillis))
                    .toBe(firstValue);
            });

            it("does rebuild arrays when zoom changes", function () {
                var firstValue = controller.labels(800, 300, 100, mockToMillis);

                mockToMillis.andCallFake(function (v) {
                    return BILLION * 2 + v;
                });

                expect(controller.labels(800, 300, 100, mockToMillis))
                    .not.toEqual(firstValue);

                expect(controller.labels(800, 300, 100, mockToMillis))
                    .not.toBe(firstValue);
            });

        });

    }
);