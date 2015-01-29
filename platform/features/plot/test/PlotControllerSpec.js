/*global define,Promise,describe,it,expect,xit,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/PlotController"],
    function (PlotController) {
        "use strict";

        describe("The plot controller", function () {
            var mockScope,
                mockFormatter,
                mockSubscriber,
                mockData,
                mockDomainObject,
                controller;

            function echo(i) { return i; }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch", "$on" ]
                );
                mockFormatter = jasmine.createSpyObj(
                    "formatter",
                    [ "formatDomainValue", "formatRangeValue" ]
                );
                mockData = jasmine.createSpyObj(
                    "data",
                    [ "getPointCount", "getDomainValue", "getRangeValue" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockSubscriber = jasmine.createSpyObj(
                    "telemetrySubscriber",
                    ["subscribe"]
                );

                mockData.getPointCount.andReturn(2);
                mockData.getDomainValue.andCallFake(echo);
                mockData.getRangeValue.andCallFake(echo);

                controller = new PlotController(mockScope, mockFormatter, mockSubscriber);
            });

            it("provides plot colors", function () {
                // PlotPalette will have its own tests
                expect(controller.getColor(0))
                    .toEqual(jasmine.any(String));

                // Colors should be unique
                expect(controller.getColor(0))
                    .not.toEqual(controller.getColor(1));
            });

            xit("draws lines when data becomes available", function () {
                // Verify precondition
                controller.getSubPlots().forEach(function (subplot) {
                    expect(subplot.getDrawingObject().lines)
                        .not.toBeDefined();
                });

                // Make sure there actually are subplots being verified
                expect(controller.getSubPlots().length > 0)
                    .toBeTruthy();

                // Broadcast data
                mockScope.$on.mostRecentCall.args[1]();

                controller.getSubPlots().forEach(function (subplot) {
                    expect(subplot.getDrawingObject().lines)
                        .toBeDefined();
                });
            });


            xit("changes modes depending on number of objects", function () {
                var expectedWatch = "telemetry.getTelemetryObjects()",
                    watchFunction;

                // Find the watch for telemetry objects, which
                // should change plot mode options
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === expectedWatch) {
                        watchFunction = call.args[1];
                    }
                });

                watchFunction([mockDomainObject]);
                expect(controller.getModeOptions().length).toEqual(1);

                watchFunction([
                    mockDomainObject,
                    mockDomainObject,
                    mockDomainObject
                ]);
                expect(controller.getModeOptions().length).toEqual(2);
            });

            // Interface tests follow; these will be delegated (mostly
            // to PlotModeOptions, which is tested separately).
            it("provides access to available plot mode options", function () {
                expect(Array.isArray(controller.getModeOptions()))
                    .toBeTruthy();
            });

            it("provides a current plot mode", function () {
                expect(controller.getMode().name)
                    .toEqual(jasmine.any(String));
            });

            xit("allows plot mode to be changed", function () {
                expect(function () {
                    controller.setMode(controller.getMode());
                }).not.toThrow();
            });

            it("provides an array of sub-plots", function () {
                expect(Array.isArray(controller.getSubPlots()))
                    .toBeTruthy();
            });

            it("allows plots to be updated", function () {
                expect(controller.update).not.toThrow();
            });

            it("allows changing pan-zoom state", function () {
                expect(controller.isZoomed).not.toThrow();
                expect(controller.stepBackPanZoom).not.toThrow();
                expect(controller.unzoom).not.toThrow();
            });
        });
    }
);