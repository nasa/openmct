/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/capabilities/TimelineUtilization'],
    function (TimelineUtilization) {
        'use strict';

        describe("A Timeline's resource utilization", function () {

            // Placeholder; WTD-918 will implement
            it("has the expected interface", function () {
                var utilization = new TimelineUtilization();
                expect(utilization.getPointCount()).toEqual(jasmine.any(Number));
                expect(utilization.getDomainValue()).toEqual(jasmine.any(Number));
                expect(utilization.getRangeValue()).toEqual(jasmine.any(Number));
            });

        });
    }
);