/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/BottomBarController"],
    function (BottomBarController) {
        "use strict";

        describe("The bottom bar controller", function () {
            var testIndicators,
                testIndicatorA,
                testIndicatorB,
                testIndicatorC,
                mockIndicator,
                controller;

            beforeEach(function () {
                mockIndicator = jasmine.createSpyObj(
                    "indicator",
                    [ "getGlyph", "getText" ]
                );

                testIndicatorA = {};
                testIndicatorB = function () { return mockIndicator; };
                testIndicatorC = { template: "someTemplate" };

                testIndicators = [
                    testIndicatorA,
                    testIndicatorB,
                    testIndicatorC
                ];

                controller = new BottomBarController(testIndicators);
            });

            it("exposes one indicator description per extension", function () {
                expect(controller.getIndicators().length)
                    .toEqual(testIndicators.length);
            });

            it("uses template field provided, or its own default", function () {
                // "indicator" is the default;
                // only testIndicatorC overrides this.
                var indicators = controller.getIndicators();
                expect(indicators[0].template).toEqual("indicator");
                expect(indicators[1].template).toEqual("indicator");
                expect(indicators[2].template).toEqual("someTemplate");
            });

            it("instantiates indicators given as constructors", function () {
                // testIndicatorB constructs to mockIndicator
                expect(controller.getIndicators()[1].ngModel).toBe(mockIndicator);
            });
        });
    }
);