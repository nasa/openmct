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
                mockPrepared,
                testBuffers,
                mode;

            function mockElement(x, y, w, h) {
                return {
                    getBoundingClientRect: function () {
                        return { left: x, top: y, width: w, height: h };
                    }
                };
            }

            function doZoom(subplot, i) {
                subplot.startMarquee({ target: mockElement() });
                subplot.hover({ target: mockElement() });
                subplot.endMarquee({ target: mockElement() });
            }

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                // Prepared telemetry data
                mockPrepared = jasmine.createSpyObj(
                    "prepared",
                    [ "getDomainOffset", "getOrigin", "getDimensions", "getBuffers" ]
                );

                // Act as if we have three buffers full of data
                testBuffers = [["a"], ["b"], ["c"]];
                mockPrepared.getBuffers.andReturn(testBuffers);
                mockPrepared.getDomainOffset.andReturn(1234);
                mockPrepared.getOrigin.andReturn([10, 10]);
                mockPrepared.getDimensions.andReturn([500, 500]);

                mode = new PlotOverlayMode([
                    mockDomainObject,
                    mockDomainObject,
                    mockDomainObject
                ]);
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

                // Should all each have one line
                mode.getSubPlots().forEach(function (subplot, i) {
                    // Either empty list or undefined is fine;
                    // just want to make sure there are no lines.
                    expect(subplot.getDrawingObject().lines.length)
                        .toEqual(3);
                    // Make sure all buffers were drawn, in order.
                    subplot.getDrawingObject().lines.forEach(function (line, j) {
                        expect(line.buffer).toEqual(testBuffers[j]);
                    });
                });
            });

            it("tracks zoomed state of subplots", function () {
                // Should start out unzoomed
                expect(mode.isZoomed()).toBeFalsy();

                // Trigger some zoom changes
                mode.getSubPlots().forEach(doZoom);

                // Should start out unzoomed
                expect(mode.isZoomed()).toBeTruthy();
            });

            it("supports unzooming", function () {
                // Trigger some zoom changes
                mode.getSubPlots().forEach(doZoom);

                // Verify that we are indeed zoomed now
                expect(mode.isZoomed()).toBeTruthy();

                // Unzoom
                mode.unzoom();

                // Should no longer be zoomed
                expect(mode.isZoomed()).toBeFalsy();
            });

            it("supports stepping back through zoom states", function () {
                // Trigger some zoom changes
                mode.getSubPlots().forEach(doZoom);

                // Step back the same number of zoom changes
                mode.getSubPlots().forEach(function (subplot, i) {
                    // Should still be zoomed at start of each iteration
                    expect(mode.isZoomed()).toBeTruthy();
                    mode.stepBackPanZoom();
                });

                // Should no longer be zoomed
                expect(mode.isZoomed()).toBeFalsy();
            });
        });
    }
);