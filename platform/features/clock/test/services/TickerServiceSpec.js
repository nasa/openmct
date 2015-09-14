/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ["../../src/services/TickerService"],
    function (TickerService) {
        "use strict";

        var TEST_TIMESTAMP = 1433354174000;

        describe("The ticker service", function () {
            var mockTimeout,
                mockNow,
                mockCallback,
                tickerService;

            beforeEach(function () {
                mockTimeout = jasmine.createSpy('$timeout');
                mockNow = jasmine.createSpy('now');
                mockCallback = jasmine.createSpy('callback');

                mockNow.andReturn(TEST_TIMESTAMP);

                tickerService = new TickerService(mockTimeout, mockNow);
            });

            it("notifies listeners of clock ticks", function () {
                tickerService.listen(mockCallback);
                mockNow.andReturn(TEST_TIMESTAMP + 12321);
                mockTimeout.mostRecentCall.args[0]();
                expect(mockCallback)
                    .toHaveBeenCalledWith(TEST_TIMESTAMP + 12321);
            });

            it("allows listeners to unregister", function () {
                tickerService.listen(mockCallback)(); // Unregister immediately
                mockNow.andReturn(TEST_TIMESTAMP + 12321);
                mockTimeout.mostRecentCall.args[0]();
                expect(mockCallback).not
                    .toHaveBeenCalledWith(TEST_TIMESTAMP + 12321);
            });
        });
    }
);
