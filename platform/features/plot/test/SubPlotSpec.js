/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
                mockFormatter,
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
                mockFormatter = jasmine.createSpyObj(
                    "formatter",
                    [ "formatDomainValue", "formatRangeValue" ]
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
                    mockPanZoomStack,
                    mockFormatter
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
                expect(subplot.getHoverCoordinates())
                    .toBeUndefined();

                // Start hovering
                subplot.hover({ target: mockElement });

                // Should now have coordinates to display
                expect(subplot.getHoverCoordinates())
                    .toEqual(jasmine.any(String));
            });

            it("supports marquee zoom", function () {
                expect(mockPanZoomStack.pushPanZoom).not.toHaveBeenCalled();

                // Simulate a marquee zoom. Note that the mockElement
                // is 100 by 100 and starts at 10,20
                subplot.startDrag({
                    target: mockElement,
                    clientX: 60,
                    clientY: 45
                });
                subplot.hover({
                    target: mockElement,
                    clientX: 75,
                    clientY: 85
                });
                subplot.endDrag({
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

            it ("indicates when there is domain data shown", function () {
                expect(subplot.hasDomainData()).toEqual(true);
            });

            it ("indicates when there is no domain data shown", function () {
                mockPanZoomStack.getDimensions.andReturn([0,0]);
                expect(subplot.hasDomainData()).toEqual(false);
            });
            
            it("disallows marquee zoom when start and end Marquee is at the same position", function () {
                expect(mockPanZoomStack.pushPanZoom).not.toHaveBeenCalled();

                // Simulate a marquee zoom. Note that the mockElement
                // is 100 by 100 and starts at 10,20
                subplot.startDrag({
                    target: mockElement,
                    clientX: 60,
                    clientY: 45
                });
                subplot.hover({
                    target: mockElement,
                    clientX: 75,
                    clientY: 85
                });
                subplot.endDrag({
                    target: mockElement,
                    clientX: 60,
                    clientY: 45
                });

                expect(mockPanZoomStack.pushPanZoom).not.toHaveBeenCalled();
            });

            it("provides access to a drawable object", function () {
                expect(typeof subplot.getDrawingObject()).toEqual('object');
            });

            it("allows a domain offset to be provided", function () {
                // Domain object is needed to adjust canvas coordinates
                // to avoid loss-of-precision associated with converting
                // to 32 bit floats.
                subplot.setDomainOffset(3);
                subplot.update();
                // Should have adjusted the origin accordingly
                expect(subplot.getDrawingObject().origin[0])
                    .toEqual(2);
            });

        });
    }
);
