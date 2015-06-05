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