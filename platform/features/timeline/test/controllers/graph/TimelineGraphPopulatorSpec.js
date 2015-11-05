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
    ['../../../src/controllers/graph/TimelineGraphPopulator'],
    function (TimelineGraphPopulator) {
        'use strict';

        describe("A Timeline's resource graph populator", function () {
            var mockSwimlanes,
                mockQ,
                testResources,
                populator;

            function asPromise(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return asPromise(callback(v));
                    },
                    testValue: v
                };
            }

            function allPromises(promises) {
                return asPromise(promises.map(function (p) {
                    return (p || {}).then ? p.testValue : p;
                }));
            }


            beforeEach(function () {
                testResources = {
                    a: [ 'xyz', 'abc' ],
                    b: [ 'xyz' ],
                    c: [ 'xyz', 'abc', 'def', 'ghi' ]
                };

                mockQ = jasmine.createSpyObj('$q', ['when', 'all']);

                mockSwimlanes = ['a', 'b', 'c'].map(function (k) {
                    var mockSwimlane = jasmine.createSpyObj(
                            'swimlane-' + k,
                            [ 'graph', 'color' ]
                        ),
                        mockGraph = jasmine.createSpyObj(
                            'graph-' + k,
                            [ 'getPointCount', 'getDomainValue', 'getRangeValue' ]
                        );
                    mockSwimlane.graph.andReturn(true);
                    mockSwimlane.domainObject = jasmine.createSpyObj(
                        'domainObject-' + k,
                        [ 'getCapability', 'hasCapability', 'useCapability', 'getId' ]
                    );
                    mockSwimlane.color.andReturn('#' + k);
                    // Provide just enough information about graphs to support
                    // determination of which graphs to show
                    mockSwimlane.domainObject.useCapability.andCallFake(function () {
                        var obj = {};
                        testResources[k].forEach(function (r) {
                            obj[r] = mockGraph;
                        });
                        return asPromise(obj);
                    });
                    mockSwimlane.domainObject.hasCapability
                        .andReturn(true);
                    mockSwimlane.domainObject.getId
                        .andReturn(k);
                    mockGraph.getPointCount.andReturn(0);

                    return mockSwimlane;
                });

                mockQ.when.andCallFake(asPromise);
                mockQ.all.andCallFake(allPromises);

                populator = new TimelineGraphPopulator(mockQ);
            });

            it("provides no graphs by default", function () {
                expect(populator.get()).toEqual([]);
            });

            it("provides one graph per resource type", function () {
                populator.populate(mockSwimlanes);
                // There are 4 unique resource types shared here...
                expect(populator.get().length).toEqual(4);
            });

            it("does not include graphs based on swimlane configuration", function () {
                mockSwimlanes[2].graph.andReturn(false);
                populator.populate(mockSwimlanes);
                // Only two unique swimlanes in the other two
                expect(populator.get().length).toEqual(2);
                // Verify interactions as well
                expect(mockSwimlanes[0].domainObject.useCapability)
                    .toHaveBeenCalledWith('graph');
                expect(mockSwimlanes[1].domainObject.useCapability)
                    .toHaveBeenCalledWith('graph');
                expect(mockSwimlanes[2].domainObject.useCapability)
                    .not.toHaveBeenCalled();
            });

            it("does not recreate graphs when swimlanes don't change", function () {
                var initialValue;
                // Get an initial set of graphs
                populator.populate(mockSwimlanes);
                initialValue = populator.get();
                // Repopulate with same data; should get same graphs
                populator.populate(mockSwimlanes);
                expect(populator.get()).toBe(initialValue);
                // Something changed...
                mockSwimlanes.pop();
                populator.populate(mockSwimlanes);
                // Now we should get different graphs
                expect(populator.get()).not.toBe(initialValue);
            });

            // Regression test for WTD-1155
            it("does recreate graphs when inclusions change", function () {
                var initialValue;
                // Get an initial set of graphs
                populator.populate(mockSwimlanes);
                initialValue = populator.get();
                // Change resource graph inclusion...
                mockSwimlanes[1].graph.andReturn(false);
                populator.populate(mockSwimlanes);
                // Now we should get different graphs
                expect(populator.get()).not.toBe(initialValue);
            });

        });
    }
);