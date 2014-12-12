/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/SubPlot"],
    function (SubPlot) {
        "use strict";

        describe("A sub-plot", function () {
            var mockDomainObject,
                mockPanZoomStack,
                mockElement,
                testDomainObjects,
                testOrigin,
                testDimensions,
                subplot;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockPanZoomStack = jasmine.createSpyObj(
                    "panZoomStack",
                    [
                        "getDepth",
                        "pushPanZoom",
                        "popPanZoom",
                        "setBasePanZoom",
                        "clearPanZoom",
                        "getPanZoom",
                        "getOrigin",
                        "getDimensions"
                    ]
                );
                mockElement = jasmine.createSpyObj(
                    "element",
                    [ "getBoundingClientRect" ]
                );

                testOrigin = [ 5, 10 ];
                testDimensions = [ 3000, 1000 ];
                testDomainObjects = [ mockDomainObject, mockDomainObject ];

                mockPanZoomStack.getOrigin.andReturn(testOrigin);
                mockPanZoomStack.getDimensions.andReturn(testDimensions);
                mockPanZoomStack.getPanZoom.andReturn(
                    { origin: testOrigin, dimensions: testDimensions }
                );
                mockElement.getBoundingClientRect.andReturn(
                    { left: 10, top: 20, width: 100, height: 100 }
                );

                subplot = new SubPlot(
                    testDomainObjects,
                    mockPanZoomStack
                );
            });


            it("provides a getter for its plotted objects", function () {
                expect(subplot.getTelemetryObjects())
                    .toEqual(testDomainObjects);
            });

            it("exposes tick marks", function () {
                // Just test availability; details are tested
                // in PlotTickFormatter
                expect(Array.isArray(subplot.getDomainTicks()))
                    .toBeTruthy();
                expect(Array.isArray(subplot.getRangeTicks()))
                    .toBeTruthy();
            });

            it("allows hovering state to be tracked", function () {
                expect(subplot.isHovering()).toBeFalsy();
                expect(subplot.isHovering(true)).toBeTruthy();
                expect(subplot.isHovering()).toBeTruthy();
                expect(subplot.isHovering(false)).toBeFalsy();
                expect(subplot.isHovering()).toBeFalsy();
            });

            it("provides hovering coordinates", function () {
                // Should be empty when not hovering
                expect(subplot.getHoverCoordinates()).toEqual([]);

                // Start hovering
                subplot.hover({ target: mockElement });

                // Should now have coordinates to display
                expect(subplot.getHoverCoordinates().length).toEqual(2);
            });

            it("supports marquee zoom", function () {
                expect(mockPanZoomStack.pushPanZoom).not.toHaveBeenCalled();

                // Simulate a marquee zoom. Note that the mockElement
                // is 100 by 100 and starts at 10,20
                subplot.startMarquee({
                    target: mockElement,
                    clientX: 60,
                    clientY: 45
                });
                subplot.hover({
                    target: mockElement,
                    clientX: 75,
                    clientY: 85
                });
                subplot.endMarquee({
                    target: mockElement,
                    clientX: 80,
                    clientY: 95
                });
                // ... so the origin should be 50%,25% into current dimensions,
                //     and new dimensions should be 20%,50% thereof

                expect(mockPanZoomStack.pushPanZoom).toHaveBeenCalledWith(
                    [
                        testOrigin[0] + testDimensions[0] * 0.50,
                        testOrigin[1] + testDimensions[1] * 0.25
                    ],
                    [
                        testDimensions[0] * 0.20,
                        testDimensions[1] * 0.50
                    ]
                );
            });
        });
    }
);