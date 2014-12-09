/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotPanZoomStack"],
    function (PlotPanZoomStack) {
        "use strict";

        describe("A plot pan-zoom stack", function () {
            var panZoomStack,
                initialOrigin,
                initialDimensions,
                otherOrigins,
                otherDimensions;

            // Shorthand for verifying getOrigin, getDimensions, and getPanZoom,
            // which should always agree.
            function verifyPanZoom(origin, dimensions) {
                expect(panZoomStack.getOrigin()).toEqual(origin);
                expect(panZoomStack.getDimensions()).toEqual(dimensions);
                expect(panZoomStack.getPanZoom()).toEqual({
                    origin: origin,
                    dimensions: dimensions
                });
            }

            beforeEach(function () {
                initialOrigin = [ 4, 2 ];
                initialDimensions = [ 600, 400 ];
                otherOrigins = [ [8, 6], [12, 9] ];
                otherDimensions = [ [400, 300], [200, 300] ];
                panZoomStack =
                    new PlotPanZoomStack(initialOrigin, initialDimensions);
            });

            it("starts off reporting its initial values", function () {
                verifyPanZoom(initialOrigin, initialDimensions);
            });

            it("allows origin/dimensions pairs to be pushed/popped", function () {
                panZoomStack.pushPanZoom(otherOrigins[0], otherDimensions[0]);
                verifyPanZoom(otherOrigins[0], otherDimensions[0]);
                panZoomStack.pushPanZoom(otherOrigins[1], otherDimensions[1]);
                verifyPanZoom(otherOrigins[1], otherDimensions[1]);
                panZoomStack.popPanZoom();
                verifyPanZoom(otherOrigins[0], otherDimensions[0]);
                panZoomStack.popPanZoom();
                verifyPanZoom(initialOrigin, initialDimensions);
            });

            it("reports current stack depth", function () {
                expect(panZoomStack.getDepth()).toEqual(1);
                panZoomStack.pushPanZoom(otherOrigins[0], otherDimensions[0]);
                expect(panZoomStack.getDepth()).toEqual(2);
                panZoomStack.pushPanZoom(otherOrigins[1], otherDimensions[1]);
                expect(panZoomStack.getDepth()).toEqual(3);
            });

            it("allows base pan zoom to be restored", function () {
                panZoomStack.pushPanZoom(otherOrigins[0], otherDimensions[0]);
                panZoomStack.pushPanZoom(otherOrigins[1], otherDimensions[1]);
                panZoomStack.clearPanZoom();
                verifyPanZoom(initialOrigin, initialDimensions);
            });

            it("allows base pan zoom to be changed", function () {
                panZoomStack.pushPanZoom(otherOrigins[0], otherDimensions[0]);
                panZoomStack.setBasePanZoom(otherOrigins[1], otherDimensions[1]);
                // Should not have changed current top-of-stack
                verifyPanZoom(otherOrigins[0], otherDimensions[0]);

                // Clear the stack - should be at our new base pan-zoom state
                panZoomStack.clearPanZoom();
                verifyPanZoom(otherOrigins[1], otherDimensions[1]);
            });
        });
    }
);