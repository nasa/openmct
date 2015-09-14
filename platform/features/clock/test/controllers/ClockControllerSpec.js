/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ["../../src/controllers/ClockController"],
    function (ClockController) {
        "use strict";

        // Wed, 03 Jun 2015 17:56:14 GMT
        var TEST_TIMESTAMP = 1433354174000;

        describe("A clock view's controller", function () {
            var mockScope,
                mockTicker,
                mockUnticker,
                mockDomainObject,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj('$scope', ['$watch', '$on']);
                mockTicker = jasmine.createSpyObj('ticker', ['listen']);
                mockUnticker = jasmine.createSpy('unticker');

                mockTicker.listen.andReturn(mockUnticker);

                controller = new ClockController(mockScope, mockTicker);
            });

            it("watches for clock format from the domain object model", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "model.clockFormat",
                    jasmine.any(Function)
                );
            });

            it("subscribes to clock ticks", function () {
                expect(mockTicker.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("unsubscribes to ticks when destroyed", function () {
                // Make sure $destroy is being listened for...
                expect(mockScope.$on.mostRecentCall.args[0]).toEqual('$destroy');
                expect(mockUnticker).not.toHaveBeenCalled();

                // ...and makes sure that its listener unsubscribes from ticker
                mockScope.$on.mostRecentCall.args[1]();
                expect(mockUnticker).toHaveBeenCalled();
            });

            it("formats using the format string from the model", function () {
                mockTicker.listen.mostRecentCall.args[0](TEST_TIMESTAMP);
                mockScope.$watch.mostRecentCall.args[1]([
                    "YYYY-DDD hh:mm:ss",
                    "clock24"
                ]);

                expect(controller.zone()).toEqual("UTC");
                expect(controller.text()).toEqual("2015-154 17:56:14");
                expect(controller.ampm()).toEqual("");
            });

            it("formats 12-hour time", function () {
                mockTicker.listen.mostRecentCall.args[0](TEST_TIMESTAMP);
                mockScope.$watch.mostRecentCall.args[1]([
                    "YYYY-DDD hh:mm:ss",
                    "clock12"
                ]);

                expect(controller.zone()).toEqual("UTC");
                expect(controller.text()).toEqual("2015-154 05:56:14");
                expect(controller.ampm()).toEqual("PM");
            });

            it("does not throw exceptions when clockFormat is undefined", function () {
                mockTicker.listen.mostRecentCall.args[0](TEST_TIMESTAMP);
                expect(function () {
                    mockScope.$watch.mostRecentCall.args[1](undefined);
                }).not.toThrow();
            });

        });
    }
);
