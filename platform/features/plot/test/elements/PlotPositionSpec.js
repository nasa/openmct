/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotPosition"],
    function (PlotPosition) {
        "use strict";

        describe("A plot position", function () {
            var mockPanZoom,
                testOrigin = [ 10, 20 ],
                testDimensions = [ 800, 10 ];

            beforeEach(function () {
                mockPanZoom = jasmine.createSpyObj(
                    "panZoomStack",
                    [ "getPanZoom" ]
                );
                mockPanZoom.getPanZoom.andReturn({
                    origin: testOrigin,
                    dimensions: testDimensions
                });
            });

            it("transforms pixel coordinates to domain-range", function () {
                var position = new PlotPosition(42, 450, 100, 1000, mockPanZoom);
                // Domain: .42 * 800 + 10 = 346
                // Range: .55 * 10 + 20 = 25.5
                // Notably, y-axis is reversed between pixel space and range
                expect(position.getPosition()).toEqual([346, 25.5]);
                expect(position.getDomain()).toEqual(346);
                expect(position.getRange()).toEqual(25.5);
            });

            it("treats a position as undefined if no pan-zoom state is present", function () {
                var position;

                mockPanZoom.getPanZoom.andReturn({});
                position = new PlotPosition(1, 2, 100, 100, mockPanZoom);
                expect(position.getDomain()).toBeUndefined();
                expect(position.getRange()).toBeUndefined();
                expect(position.getPosition()).toEqual([]);
            });
        });
    }
);