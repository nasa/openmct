/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/capabilities/ResourceGraph'],
    function (ResourceGraph) {
        'use strict';

        describe("A resource graph capability", function () {

            // Placeholder; WTD-918 will implement
            it("has zero points for zero utilization changes", function () {
                var graph = new ResourceGraph([]);
                expect(graph.getPointCount()).toEqual(0);
            });

            it("creates steps based on resource utilizations", function () {
                var graph = new ResourceGraph([
                    { start: 5, end: 100, value: 42 },
                    { start: 50, end: 120, value: -22 },
                    { start: 15, end: 40, value: 30 },
                    { start: 150, end: 180, value: -10 }
                ]);

                expect(graph.getPointCount()).toEqual(16);

                // Should get two values at every time stamp, for step-like appearance
                [ 5, 15, 40, 50, 100, 120, 150, 180].forEach(function (v, i) {
                    expect(graph.getDomainValue(i * 2)).toEqual(v);
                    expect(graph.getDomainValue(i * 2 + 1)).toEqual(v);
                });

                // Should also repeat values at subsequent indexes, but offset differently,
                // for horizontal spans between steps
                [ 0, 42, 72, 42, 20, -22, 0, -10].forEach(function (v, i) {
                    expect(graph.getRangeValue(i * 2)).toEqual(v);
                    // Offset backwards; wrap around end of the series
                    expect(graph.getRangeValue((16 + i * 2 - 1) % 16)).toEqual(v);
                });
            });

            it("filters out zero-duration spikes", function () {
                var graph = new ResourceGraph([
                    { start: 5, end: 100, value: 42 },
                    { start: 100, end: 120, value: -22 },
                    { start: 100, end: 180, value: 30 },
                    { start: 130, end: 180, value: -10 }
                ]);

                // There are only 5 unique timestamps there, so there should
                // be 5 steps, for 10 total points
                expect(graph.getPointCount()).toEqual(10);
            });

        });
    }
);