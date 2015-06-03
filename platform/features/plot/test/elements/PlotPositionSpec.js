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