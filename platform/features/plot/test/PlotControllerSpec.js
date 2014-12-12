/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/PlotController"],
    function (PlotController) {
        "use strict";

        describe("The plot controller", function () {
            var mockScope,
                mockTelemetry, // mock telemetry controller
                mockData,
                mockElement,
                controller;

            function echo(i) { return i; }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch", "$on" ]
                );
                mockTelemetry = jasmine.createSpyObj(
                    "telemetry",
                    [ "getResponse", "getMetadata" ]
                );
                mockData = jasmine.createSpyObj(
                    "data",
                    [ "getPointCount", "getDomainValue", "getRangeValue" ]
                );
                mockElement = jasmine.createSpyObj(
                    "element",
                    [ "getBoundingClientRect" ]
                );

                mockScope.telemetry = mockTelemetry;
                mockTelemetry.getResponse.andReturn([mockData]);
                mockData.getPointCount.andReturn(2);
                mockData.getDomainValue.andCallFake(echo);
                mockData.getRangeValue.andCallFake(echo);
                mockElement.getBoundingClientRect.andReturn({
                    left: 0,
                    top: 0,
                    width: 100,
                    height: 100
                });

                controller = new PlotController(mockScope);
            });

            it("listens for telemetry updates", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "telemetryUpdate",
                    jasmine.any(Function)
                );
            });

            it("provides plot colors", function () {
                // PlotPalette will have its own tests
                expect(controller.getColor(0))
                    .toEqual(jasmine.any(String));

                // Colors should be unique
                expect(controller.getColor(0))
                    .not.toEqual(controller.getColor(1));
            });

            it("does not fail if telemetry controller is not in scope", function () {
                mockScope.telemetry = undefined;

                // Broadcast data
                mockScope.$on.mostRecentCall.args[1]();

                // Just want to not have an exception
            });



        });
    }
);