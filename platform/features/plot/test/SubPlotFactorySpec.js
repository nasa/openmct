/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/SubPlotFactory"],
    function (SubPlotFactory) {
        "use strict";

        describe("The sub-plot factory", function () {
            var mockDomainObject,
                mockPanZoomStack,
                mockFormatter,
                factory;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
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

                factory = new SubPlotFactory(mockFormatter);
            });

            it("creates sub-plots", function () {
                expect(factory.createSubPlot(
                    [mockDomainObject],
                    mockPanZoomStack
                ).getTelemetryObjects()).toEqual([mockDomainObject]);
            });
        });
    }
);