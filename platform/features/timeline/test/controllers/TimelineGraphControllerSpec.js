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
    ['../../src/controllers/TimelineGraphController'],
    function (TimelineGraphController) {
        'use strict';

        describe("The Timeline graph controller", function () {
            var mockScope,
                testResources,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    '$scope',
                    [ '$watchCollection' ]
                );
                testResources = [
                    { key: 'abc', name: "Some name" },
                    { key: 'def', name: "Test type", units: "Test units" },
                    { key: 'xyz', name: "Something else" }
                ];
                controller = new TimelineGraphController(
                    mockScope,
                    testResources
                );
            });

            it("watches for parameter changes", function () {
                expect(mockScope.$watchCollection).toHaveBeenCalledWith(
                    'parameters',
                    jasmine.any(Function)
                );
            });

            it("updates graphs when parameters change", function () {
                var mockGraphA = jasmine.createSpyObj('graph-a', ['setBounds']),
                    mockGraphB = jasmine.createSpyObj('graph-b', ['setBounds']);

                // Supply new parameters
                mockScope.$watchCollection.mostRecentCall.args[1]({
                    graphs: [ mockGraphA, mockGraphB ],
                    origin: 9,
                    duration: 144
                });

                // Graphs should have both been updated
                expect(mockGraphA.setBounds).toHaveBeenCalledWith(9, 144);
                expect(mockGraphB.setBounds).toHaveBeenCalledWith(9, 144);
            });

            it("provides labels for graphs", function () {
                var mockGraph = jasmine.createSpyObj('graph', ['minimum', 'maximum']);

                mockGraph.minimum.andReturn(12.3412121);
                mockGraph.maximum.andReturn(88.7555555);
                mockGraph.key = "def";

                expect(controller.label(mockGraph)).toEqual({
                    title: "Test type (Test units)",
                    low: "12.341",
                    middle: "50.548",
                    high: "88.756"
                });
            });
        });
    }
);
