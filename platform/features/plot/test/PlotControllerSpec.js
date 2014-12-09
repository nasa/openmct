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

            it("draws lines when telemetry data becomes available", function () {
                // Broadcast data
                mockScope.$on.mostRecentCall.args[1]();

                // Should have put some lines in the drawing scope,
                // which the template should pass along to the renderer
                expect(mockScope.draw.lines).toBeDefined();
            });

            it("does not fail if telemetry controller is not in scope", function () {
                mockScope.telemetry = undefined;

                // Broadcast data
                mockScope.$on.mostRecentCall.args[1]();

                // Just want to not have an exception
            });

            it("provides coordinates on hover", function () {
                expect(controller.getHoverCoordinates().length).toEqual(0);

                controller.hover({
                    target: mockElement
                });

                expect(controller.getHoverCoordinates().length).toEqual(2);
            });

            it("permits marquee zoom", function () {
                // Verify pre-condition
                expect(controller.isZoomed()).toBeFalsy();

                // Simulate a marquee zoom interaction
                controller.startMarquee({
                    target: mockElement,
                    clientX: 0,
                    clientY: 10
                });

                controller.hover({
                    target: mockElement,
                    clientX: 0,
                    clientY: 0
                });

                controller.endMarquee({
                    target: mockElement,
                    clientX: 10,
                    clientY: 0
                });

                expect(controller.isZoomed()).toBeTruthy();
            });

            it("permits unøom", function () {
                // Simulate a marquee zoom interaction
                controller.startMarquee({
                    target: mockElement,
                    clientX: 0,
                    clientY: 10
                });

                controller.hover({
                    target: mockElement,
                    clientX: 0,
                    clientY: 0
                });

                controller.endMarquee({
                    target: mockElement,
                    clientX: 10,
                    clientY: 0
                });

                // Verify precondition
                expect(controller.isZoomed()).toBeTruthy();

                // Perform the unzoom
                controller.unzoom();

                // Should no longer report as zoomed
                expect(controller.isZoomed()).toBeFalsy();
            });


            it("permits unøom", function () {
                // Simulate two marquee zooms interaction
                [0, 1].forEach(function (n) {
                    controller.startMarquee({
                        target: mockElement,
                        clientX: 0,
                        clientY: 10 + 10 * n
                    });

                    controller.hover({
                        target: mockElement,
                        clientX: 0,
                        clientY: 0
                    });

                    controller.endMarquee({
                        target: mockElement,
                        clientX: 10 + 10 * n,
                        clientY: 0
                    });
                });

                // Verify precondition
                expect(controller.isZoomed()).toBeTruthy();

                // Step back...
                controller.stepBackPanZoom();

                // Should still be zoomed
                expect(controller.isZoomed()).toBeTruthy();

                // Step back again...
                controller.stepBackPanZoom();

                // Should no longer report as zoomed
                expect(controller.isZoomed()).toBeFalsy();
            });


        });
    }
);