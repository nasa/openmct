/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/modes/PlotOverlayMode"],
    function (PlotOverlayMode) {
        "use strict";

        describe("Overlaid plot mode", function () {
            var mockDomainObject,
                mockSubPlotFactory,
                mockSubPlot,
                mockPrepared,
                testBuffers,
                testDrawingObjects,
                mode;

            function mockElement(x, y, w, h) {
                return {
                    getBoundingClientRect: function () {
                        return { left: x, top: y, width: w, height: h };
                    }
                };
            }

            function createMockSubPlot() {
                var mockSubPlot = jasmine.createSpyObj(
                        "subPlot",
                        [
                            "setDomainOffset",
                            "hover",
                            "startMarquee",
                            "endMarquee",
                            "getDrawingObject",
                            "update"
                        ]
                    ),
                    testDrawingObject = {};

                // Track drawing objects in order of creation
                testDrawingObjects.push(testDrawingObject);
                mockSubPlot.getDrawingObject.andReturn(testDrawingObject);
                return mockSubPlot;
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockSubPlotFactory = jasmine.createSpyObj(
                    "subPlotFactory",
                    [ "createSubPlot" ]
                );
                // Prepared telemetry data
                mockPrepared = jasmine.createSpyObj(
                    "prepared",
                    [ "getDomainOffset", "getOrigin", "getDimensions", "getBuffers" ]
                );

                mockSubPlotFactory.createSubPlot.andCallFake(createMockSubPlot);

                // Act as if we have three buffers full of data
                testBuffers = [["a"], ["b"], ["c"]];
                mockPrepared.getBuffers.andReturn(testBuffers);
                mockPrepared.getDomainOffset.andReturn(1234);
                mockPrepared.getOrigin.andReturn([10, 10]);
                mockPrepared.getDimensions.andReturn([500, 500]);

                // Clear out drawing objects
                testDrawingObjects = [];

                mode = new PlotOverlayMode([
                    mockDomainObject,
                    mockDomainObject,
                    mockDomainObject
                ], mockSubPlotFactory);
            });

            it("creates one sub-plot for all domain objects", function () {
                expect(mode.getSubPlots().length).toEqual(1);
            });

            it("draws telemetry to subplots", function () {
                // Verify precondition
                mode.getSubPlots().forEach(function (subplot) {
                    // Either empty list or undefined is fine;
                    // just want to make sure there are no lines.
                    expect(subplot.getDrawingObject().lines || [])
                        .toEqual([]);
                });

                mode.plotTelemetry(mockPrepared);

                // Should have one sub-plot with three lines
                testDrawingObjects.forEach(function (testDrawingObject, i) {
                    // Either empty list or undefined is fine;
                    // just want to make sure there are no lines.
                    expect(testDrawingObject.lines.length)
                        .toEqual(3);
                    // Make sure the right buffer was drawn to the
                    // right subplot.
                    testDrawingObject.lines.forEach(function (line, j) {
                        expect(line.buffer).toEqual(testBuffers[j]);
                    });
                });
            });

            it("tracks zoomed state of subplots", function () {
                // Should start out unzoomed
                expect(mode.isZoomed()).toBeFalsy();

                // Trigger some zoom changes
                mockSubPlotFactory.createSubPlot.calls.forEach(function (c) {
                    // Second argument to the factory was pan-zoom stack
                    c.args[1].pushPanZoom([1, 2], [3, 4]);
                });

                // Should start out unzoomed
                expect(mode.isZoomed()).toBeTruthy();
            });

            it("supports unzooming", function () {
                // Trigger some zoom changes
                mockSubPlotFactory.createSubPlot.calls.forEach(function (c) {
                    // Second argument to the factory was pan-zoom stack
                    c.args[1].pushPanZoom([1, 2], [3, 4]);
                });
                // Verify that we are indeed zoomed now
                expect(mode.isZoomed()).toBeTruthy();

                // Unzoom
                mode.unzoom();

                // Should no longer be zoomed
                expect(mode.isZoomed()).toBeFalsy();
            });

            it("supports stepping back through zoom states", function () {
                // Trigger some zoom changes
                mockSubPlotFactory.createSubPlot.calls.forEach(function (c) {
                    // Second argument to the factory was pan-zoom stack
                    c.args[1].pushPanZoom([1, 2], [3, 4]);
                });

                // Step back the same number of zoom changes
                mockSubPlotFactory.createSubPlot.calls.forEach(function (c) {
                    // Should still be zoomed at start of each iteration
                    expect(mode.isZoomed()).toBeTruthy();
                    // Step back one of the zoom changes.
                    mode.stepBackPanZoom();
                });

                // Should no longer be zoomed
                expect(mode.isZoomed()).toBeFalsy();
            });
        });
    }
);