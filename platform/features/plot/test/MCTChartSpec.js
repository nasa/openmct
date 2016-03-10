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
    ["../src/MCTChart"],
    function (MCTChart) {
        "use strict";

        describe("The mct-chart directive", function () {
            var mockInterval,
                mockLog,
                mockScope,
                mockElement,
                mockCanvas,
                mockGL,
                mockC2d,
                mockPromise,
                mctChart;

            beforeEach(function () {
                mockInterval =
                    jasmine.createSpy("$interval");
                mockLog =
                    jasmine.createSpyObj("$log", ["warn", "info", "debug"]);
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    ["$watchCollection", "$on", "$apply"]
                );
                mockElement =
                    jasmine.createSpyObj("element", ["find", "html"]);
                mockInterval.cancel = jasmine.createSpy("cancelInterval");
                mockPromise = jasmine.createSpyObj("promise", ["then"]);


                // mct-chart uses GLChart, so it needs WebGL API
                mockCanvas =
                    jasmine.createSpyObj("canvas", [ "getContext", "addEventListener" ]);
                mockGL = jasmine.createSpyObj(
                    "gl",
                    [
                        "createShader",
                        "compileShader",
                        "shaderSource",
                        "attachShader",
                        "createProgram",
                        "linkProgram",
                        "useProgram",
                        "enableVertexAttribArray",
                        "getAttribLocation",
                        "getUniformLocation",
                        "createBuffer",
                        "lineWidth",
                        "enable",
                        "blendFunc",
                        "viewport",
                        "clear",
                        "uniform2fv",
                        "uniform4fv",
                        "bufferData",
                        "bindBuffer",
                        "vertexAttribPointer",
                        "drawArrays"
                    ]
                );
                mockC2d = jasmine.createSpyObj('c2d', ['clearRect']);
                mockGL.ARRAY_BUFFER = "ARRAY_BUFFER";
                mockGL.DYNAMIC_DRAW = "DYNAMIC_DRAW";
                mockGL.TRIANGLE_FAN = "TRIANGLE_FAN";
                mockGL.LINE_STRIP = "LINE_STRIP";

                // Echo back names for uniform locations, so we can
                // test which of these are set for certain operations.
                mockGL.getUniformLocation.andCallFake(function (a, name) {
                    return name;
                });

                mockElement.find.andReturn([mockCanvas]);
                mockCanvas.getContext.andCallFake(function (type) {
                    return { webgl: mockGL, '2d': mockC2d }[type];
                });
                mockInterval.andReturn(mockPromise);

                mctChart = new MCTChart(mockInterval, mockLog);
            });

            it("is applicable at the element level", function () {
                expect(mctChart.restrict).toEqual("E");
            });

            it("places a 'draw' attribute in-scope", function () {
                // Should ask Angular for the draw attribute
                expect(mctChart.scope.draw).toEqual("=");
            });

            it("watches for changes in the drawn object", function () {
                mctChart.link(mockScope, mockElement);
                expect(mockScope.$watchCollection)
                    .toHaveBeenCalledWith("draw", jasmine.any(Function));
            });

            it("issues one draw call per line", function () {
                mctChart.link(mockScope, mockElement);
                mockScope.$watchCollection.mostRecentCall.args[1]({
                    lines: [ {}, {}, {} ]
                });
                expect(mockGL.drawArrays.calls.length).toEqual(3);
            });

            it("issues one draw call per box", function () {
                mctChart.link(mockScope, mockElement);
                mockScope.$watchCollection.mostRecentCall.args[1]({
                    boxes: [
                        { start: [0, 0], end: [1, 1] },
                        { start: [0, 0], end: [1, 1] },
                        { start: [0, 0], end: [1, 1] },
                        { start: [0, 0], end: [1, 1] }
                    ]
                });
                expect(mockGL.drawArrays.calls.length).toEqual(4);
            });

            it("does not fail if no draw object is in scope", function () {
                mctChart.link(mockScope, mockElement);
                expect(mockScope.$watchCollection.mostRecentCall.args[1])
                    .not.toThrow();
            });

            it("draws on canvas resize", function () {
                mctChart.link(mockScope, mockElement);

                // Should track canvas size in an interval
                expect(mockInterval).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    jasmine.any(Number),
                    0,
                    false
                );

                // Verify pre-condition
                expect(mockGL.clear).not.toHaveBeenCalled();

                mockCanvas.width = 100;
                mockCanvas.offsetWidth = 150;
                mockCanvas.height = 200;
                mockCanvas.offsetHeight = 200;
                mockInterval.mostRecentCall.args[0]();

                // Use clear as an indication that drawing has occurred
                expect(mockGL.clear).toHaveBeenCalled();
            });

            it("warns if no WebGL context is available", function () {
                mockCanvas.getContext.andReturn(undefined);
                mctChart.link(mockScope, mockElement);
                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("falls back to Canvas 2d API if WebGL context is lost", function () {
                mctChart.link(mockScope, mockElement);
                expect(mockCanvas.addEventListener)
                    .toHaveBeenCalledWith("webglcontextlost", jasmine.any(Function));
                expect(mockCanvas.getContext).not.toHaveBeenCalledWith('2d');
                mockCanvas.addEventListener.mostRecentCall.args[1]();
                expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
            });

            it("logs nothing in nominal situations (WebGL available)", function () {
                // Complement the previous test
                mctChart.link(mockScope, mockElement);
                expect(mockLog.warn).not.toHaveBeenCalled();
            });

            // Avoid resource leaks
            it("stops polling for size changes on destroy", function () {
                mctChart.link(mockScope, mockElement);

                // Should be listening for a destroy event
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );

                // Precondition - interval still active
                expect(mockInterval.cancel).not.toHaveBeenCalled();

                // Broadcast a $destroy
                mockScope.$on.mostRecentCall.args[1]();

                // Should have stopped the interval
                expect(mockInterval.cancel).toHaveBeenCalledWith(mockPromise);
            });

        });
    }
);
