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
    ["../src/Canvas2DChart"],
    function (Canvas2DChart) {
        "use strict";

        describe("A canvas 2d chart", function () {
            var mockCanvas,
                mock2d,
                chart;

            beforeEach(function () {
                mockCanvas = jasmine.createSpyObj("canvas", [ "getContext" ]);
                mock2d = jasmine.createSpyObj(
                    "2d",
                    [
                        "clearRect",
                        "beginPath",
                        "moveTo",
                        "lineTo",
                        "stroke",
                        "fillRect"
                    ]
                );
                mockCanvas.getContext.andReturn(mock2d);

                chart = new Canvas2DChart(mockCanvas);
            });

            // Note that tests below are less specific than they
            // could be, esp. w.r.t. arguments to drawing calls;
            // this is a fallback option so is a lower test priority.

            it("allows the canvas to be cleared", function () {
                chart.clear();
                expect(mock2d.clearRect).toHaveBeenCalled();
            });

            it("doees not construct if 2D is unavailable", function () {
                mockCanvas.getContext.andReturn(undefined);
                expect(function () {
                    return new Canvas2DChart(mockCanvas);
                }).toThrow();
            });

            it("allows dimensions to be set", function () {
                // No return value, just verify API is present
                chart.setDimensions([120, 120], [0, 10]);
            });

            it("allows lines to be drawn", function () {
                var testBuffer = [ 0, 1, 3, 8 ],
                    testColor = [ 0.25, 0.33, 0.66, 1.0 ],
                    testPoints = 2;
                chart.drawLine(testBuffer, testColor, testPoints);
                expect(mock2d.beginPath).toHaveBeenCalled();
                expect(mock2d.lineTo.calls.length).toEqual(1);
                expect(mock2d.stroke).toHaveBeenCalled();
            });

            it("allows squares to be drawn", function () {
                var testMin = [0, 1],
                    testMax = [10, 10],
                    testColor = [ 0.25, 0.33, 0.66, 1.0 ];

                chart.drawSquare(testMin, testMax, testColor);
                expect(mock2d.fillRect).toHaveBeenCalled();
            });

        });
    }
);