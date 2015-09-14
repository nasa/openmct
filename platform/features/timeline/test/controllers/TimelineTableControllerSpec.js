/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    [
        '../../src/controllers/TimelineTableController',
        '../../src/TimelineFormatter'
    ],
    function (TimelineTableController, TimelineFormatter) {
        "use strict";

        describe("The timeline table controller", function () {
            var formatter, controller;

            beforeEach(function () {
                controller = new TimelineTableController();
                formatter = new TimelineFormatter();
            });

            // This controller's job is just to expose the formatter
            // in scope, so simply verify that the two agree.
            it("formats durations", function () {
                [ 0, 100, 4123, 93600, 748801230012].forEach(function (n) {
                    expect(controller.niceTime(n))
                        .toEqual(formatter.format(n));
                });
            });


        });
    }
);
