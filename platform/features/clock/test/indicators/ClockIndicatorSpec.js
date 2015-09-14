/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ["../../src/indicators/ClockIndicator"],
    function (ClockIndicator) {
        "use strict";

        // Wed, 03 Jun 2015 17:56:14 GMT
        var TEST_TIMESTAMP = 1433354174000,
            TEST_FORMAT = "YYYY-DDD HH:mm:ss";

        describe("The clock indicator", function () {
            var mockTicker,
                mockUnticker,
                indicator;

            beforeEach(function () {
                mockTicker = jasmine.createSpyObj('ticker', ['listen']);
                mockUnticker = jasmine.createSpy('unticker');

                mockTicker.listen.andReturn(mockUnticker);

                indicator = new ClockIndicator(mockTicker, TEST_FORMAT);
            });

            it("displays the current time", function () {
                mockTicker.listen.mostRecentCall.args[0](TEST_TIMESTAMP);
                expect(indicator.getText()).toEqual("2015-154 17:56:14 UTC");
            });

            it("implements the Indicator interface", function () {
                expect(indicator.getGlyph()).toEqual(jasmine.any(String));
                expect(indicator.getGlyphClass()).toEqual(jasmine.any(String));
                expect(indicator.getText()).toEqual(jasmine.any(String));
                expect(indicator.getDescription()).toEqual(jasmine.any(String));
            });

        });
    }
);
