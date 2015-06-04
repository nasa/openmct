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
    ["../../src/elements/PlotPalette"],
    function (PlotPalette) {
        "use strict";

        describe("The plot palette", function () {
            it("can be used as a constructor", function () {
                // PlotPalette has all static methods, so make
                // sure it returns itself if used as a constructor.
                expect(new PlotPalette()).toBe(PlotPalette);
            });

            it("has 30 unique colors in an integer format", function () {
                // Integer format may be useful internal to the application.
                // RGB 0-255
                var i, j;

                // Used to verify one of R, G, B in loop below
                function verifyChannel(c) {
                    expect(typeof c).toEqual("number");
                    expect(c <= 255).toBeTruthy();
                    expect(c >= 0).toBeTruthy();
                }

                for (i = 0; i < 30; i += 1) {
                    // Verify that we got an array of numbers
                    expect(Array.isArray(PlotPalette.getIntegerColor(i)))
                        .toBeTruthy();
                    expect(PlotPalette.getIntegerColor(i).length).toEqual(3);

                    // Verify all three channels for type and range
                    PlotPalette.getIntegerColor(i).forEach(verifyChannel);

                    // Verify uniqueness
                    for (j = i + 1; j < 30; j += 1) {
                        expect(PlotPalette.getIntegerColor(i)).not.toEqual(
                            PlotPalette.getIntegerColor(j)
                        );
                    }
                }
            });


            it("has 30 unique colors in a floating-point format", function () {
                // Float format is useful to WebGL.
                // RGB 0.0-1.1
                var i, j;

                // Used to verify one of R, G, B in loop below
                function verifyChannel(c) {
                    expect(typeof c).toEqual("number");
                    expect(c <= 1.0).toBeTruthy();
                    expect(c >= 0.0).toBeTruthy();
                }

                for (i = 0; i < 30; i += 1) {
                    // Verify that we got an array of numbers
                    expect(Array.isArray(PlotPalette.getFloatColor(i)))
                        .toBeTruthy();
                    expect(PlotPalette.getFloatColor(i).length).toEqual(4);

                    // Verify all three channels for type and range
                    PlotPalette.getFloatColor(i).forEach(verifyChannel);

                    // Verify uniqueness
                    for (j = i + 1; j < 30; j += 1) {
                        expect(PlotPalette.getFloatColor(i)).not.toEqual(
                            PlotPalette.getFloatColor(j)
                        );
                    }
                }
            });


            it("has 30 unique colors in a string format", function () {
                // String format is useful in stylesheets
                // #RRGGBB in hex
                var i, j, c;


                for (i = 0; i < 30; i += 1) {
                    c = PlotPalette.getStringColor(i);

                    // Verify that we #-style color strings
                    expect(typeof c).toEqual('string');
                    expect(c.length).toEqual(7);
                    expect(/^#[0-9a-fA-F]+$/.test(c)).toBeTruthy();

                    // Verify uniqueness
                    for (j = i + 1; j < 30; j += 1) {
                        expect(PlotPalette.getStringColor(i)).not.toEqual(
                            PlotPalette.getStringColor(j)
                        );
                    }
                }
            });
        });
    }
);