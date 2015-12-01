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
    ['../../../src/controllers/graph/TimelineGraph'],
    function (TimelineGraph) {
        'use strict';

        describe("A Timeline's resource graph", function () {
            var mockDomainObjects,
                mockRenderer,
                testColors,
                mockGraphs,
                graph;

            function asPromise(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return asPromise(callback(v));
                    }
                };
            }


            beforeEach(function () {
                testColors = {
                    a: [ 0, 1, 0 ],
                    b: [ 1, 0, 1 ],
                    c: [ 1, 0, 0 ]
                };

                mockGraphs = [];
                mockDomainObjects = {};

                ['a', 'b', 'c'].forEach(function (k, i) {
                    var mockGraph = jasmine.createSpyObj(
                            'utilization-' + k,
                            [ 'getPointCount', 'getDomainValue', 'getRangeValue' ]
                        );
                    mockDomainObjects[k] = jasmine.createSpyObj(
                        'domainObject-' + k,
                        [ 'getCapability', 'useCapability' ]
                    );
                    mockDomainObjects[k].useCapability.andReturn(asPromise({
                        testResource: mockGraph
                    }));
                    mockGraph.getPointCount.andReturn(i + 2);
                    mockGraph.testField = k;
                    mockGraph.testIndex = i;

                    // Store to allow changes later
                    mockGraphs.push(mockGraph);
                });

                mockRenderer = jasmine.createSpyObj(
                    'renderer',
                    [ 'render', 'decode' ]
                );

                mockRenderer.render.andCallFake(function (utilization) {
                    var result = [];
                    while (result.length < (utilization.testIndex + 2) * 2) {
                        result.push(Math.floor(result.length / 2));
                        // Alternate +/- to give something to test to
                        result.push(
                            ((result.length % 4 > 1) ? -1 : 1) *
                                    (10 * utilization.testIndex)
                        );
                    }
                    return result;
                });

                mockRenderer.decode.andCallFake(function (color) {
                    return testColors[color];
                });

                graph = new TimelineGraph(
                    'testResource',
                    mockDomainObjects,
                    mockRenderer
                );
            });

            it("exposes minimum/maximum", function () {
                expect(graph.minimum()).toEqual(-20);
                expect(graph.maximum()).toEqual(20);
            });

            it("exposes resource key", function () {
                expect(graph.key).toEqual('testResource');
            });

            it("exposes a rendered drawing object", function () {
                // Much of the work here is done by the renderer,
                // so just check that it got used and assigned
                expect(graph.drawingObject.lines).toEqual([
                    {
                        color: testColors.a,
                        buffer: [0, 0, 1, 0],
                        points: 2
                    },
                    {
                        color: testColors.b,
                        buffer: [0, 10, 1, -10, 2, 10],
                        points: 3
                    },
                    {
                        color: testColors.c,
                        buffer: [0, 20, 1, -20, 2, 20, 3, -20],
                        points: 4
                    }
                ]);
            });

            it("allows its bounds to be specified", function () {
                graph.setBounds(42, 12321);
                expect(graph.drawingObject.origin[0]).toEqual(42);
                expect(graph.drawingObject.dimensions[0]).toEqual(12321);
            });

            it("provides a minimum/maximum even with no data", function () {
                mockGraphs.forEach(function (mockGraph) {
                    mockGraph.getPointCount.andReturn(0);
                });

                // Create a graph of these utilizations
                graph = new TimelineGraph(
                    'testResource',
                    mockDomainObjects,
                    mockRenderer
                );

                // Verify that we get some usable defaults
                expect(graph.minimum()).toEqual(jasmine.any(Number));
                expect(graph.maximum()).toEqual(jasmine.any(Number));
                expect(graph.maximum() > graph.minimum()).toBeTruthy();
            });

            it("refreshes lines upon request", function () {
                // Mock renderer looks at testIndex, so change it here...
                mockGraphs[0].testIndex = 3;
                // Should trigger a new render
                graph.refresh();
                // Values correspond to the new index now
                expect(graph.drawingObject.lines[0].buffer).toEqual(
                    [0, 30, 1, -30, 2, 30, 3, -30, 4, 30]
                );
            });

        });
    }
);