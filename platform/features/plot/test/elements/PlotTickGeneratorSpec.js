/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotTickGenerator"],
    function (PlotTickGenerator) {
        "use strict";

        describe("A plot tick generator", function () {
            var mockPanZoomStack,
                mockFormatter,
                generator;

            beforeEach(function () {
                mockPanZoomStack = jasmine.createSpyObj(
                    "panZoomStack",
                    [ "getPanZoom" ]
                );
                mockFormatter = jasmine.createSpyObj(
                    "formatter",
                    [ "formatDomainValue", "formatRangeValue" ]
                );

                mockPanZoomStack.getPanZoom.andReturn({
                    origin: [ 0, 0 ],
                    dimensions: [ 100, 100 ]
                });

                generator =
                    new PlotTickGenerator(mockPanZoomStack, mockFormatter);
            });

            it("provides tick marks for range", function () {
                expect(generator.generateRangeTicks(11).length).toEqual(11);

                // Should have used range formatter
                expect(mockFormatter.formatRangeValue).toHaveBeenCalled();
                expect(mockFormatter.formatDomainValue).not.toHaveBeenCalled();

            });

            it("provides tick marks for domain", function () {
                expect(generator.generateDomainTicks(11).length).toEqual(11);

                // Should have used domain formatter
                expect(mockFormatter.formatRangeValue).not.toHaveBeenCalled();
                expect(mockFormatter.formatDomainValue).toHaveBeenCalled();
            });

        });
    }
);