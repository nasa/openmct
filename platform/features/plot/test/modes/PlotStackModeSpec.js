/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/modes/PlotStackMode"],
    function (PlotStackMode) {
        "use strict";

        describe("Stacked plot mode", function () {
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
                    [ "getDomainOffset", "getOrigin", "getDimensions", "getLineBuffers" ]
                );

                mockSubPlotFactory.createSubPlot.andCallFake(createMockSubPlot);

                // Act as if we have three buffers full of data
                testBuffers = ['a', 'b', 'c'].map(function (id) {
                    var mockBuffer = jasmine.createSpyObj(
                        'buffer-' + id,
                        ['getBuffer', 'getLength']
                    );
                    mockBuffer.getBuffer.andReturn([id]);
                    mockBuffer.getLength.andReturn(3);
                    return mockBuffer;
                });
                mockPrepared.getLineBuffers.andReturn(testBuffers);
                mockPrepared.getDomainOffset.andReturn(1234);
                mockPrepared.getOrigin.andReturn([10, 10]);
                mockPrepared.getDimensions.andReturn([500, 500]);

                // Objects that will be drawn to in sub-plots
                testDrawingObjects = [];

                mode = new PlotStackMode([
                    mockDomainObject,
                    mockDomainObject,
                    mockDomainObject
                ], mockSubPlotFactory);
            });

            it("creates one sub-plot per domain object", function () {
                expect(mode.getSubPlots().length).toEqual(3);
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

                // Should all each have one line
                testDrawingObjects.forEach(function (testDrawingObject, i) {
                    // Either empty list or undefined is fine;
                    // just want to make sure there are no lines.
                    expect(testDrawingObject.lines.length)
                        .toEqual(1);
                    // Make sure the right buffer was drawn to the
                    // right subplot.
                    expect(testDrawingObject.lines[0].buffer)
                        .toEqual(testBuffers[i].getBuffer());
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
                    // Step back
                    mode.stepBackPanZoom();
                });

                // Should no longer be zoomed
                expect(mode.isZoomed()).toBeFalsy();
            });

        });
    }
);