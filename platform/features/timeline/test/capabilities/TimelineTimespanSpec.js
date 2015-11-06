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
    ['../../src/capabilities/TimelineTimespan'],
    function (TimelineTimespan) {
        'use strict';

        describe("A Timeline's timespan", function () {
            var testModel,
                mockTimespans,
                mockMutation,
                mutationModel,
                timespan;

            function makeMockTimespan(end) {
                var mockTimespan = jasmine.createSpyObj(
                    'timespan-' + end,
                    ['getEnd']
                );
                mockTimespan.getEnd.andReturn(end);
                return mockTimespan;
            }

            beforeEach(function () {
                testModel = {
                    start: {
                        timestamp: 42000,
                        epoch: "TEST"
                    }
                };

                mutationModel = JSON.parse(JSON.stringify(testModel));

                mockMutation = jasmine.createSpyObj("mutation", ["mutate"]);
                mockTimespans = [ 44000, 65000, 1100 ].map(makeMockTimespan);

                mockMutation.mutate.andCallFake(function (mutator) {
                    mutator(mutationModel);
                });

                timespan = new TimelineTimespan(
                    testModel,
                    mockMutation,
                    mockTimespans
                );
            });

            it("provides a start time", function () {
                expect(timespan.getStart()).toEqual(42000);
            });

            it("provides an end time", function () {
                expect(timespan.getEnd()).toEqual(65000);
            });

            it("provides duration", function () {
                expect(timespan.getDuration()).toEqual(65000 - 42000);
            });

            it("provides an epoch", function () {
                expect(timespan.getEpoch()).toEqual("TEST");
            });


            it("sets start time using mutation capability", function () {
                timespan.setStart(52000);
                expect(mutationModel.start.timestamp).toEqual(52000);
                // Original model should still be the same
                expect(testModel.start.timestamp).toEqual(42000);
            });

            it("makes no changes with setEnd", function () {
                // Copy initial state to verify that it doesn't change
                var initialModel = JSON.parse(JSON.stringify(testModel));
                timespan.setEnd(123454321);
                // Neither model should have changed
                expect(testModel).toEqual(initialModel);
                expect(mutationModel).toEqual(initialModel);
            });

            it("makes no changes with setDuration", function () {
                // Copy initial state to verify that it doesn't change
                var initialModel = JSON.parse(JSON.stringify(testModel));
                timespan.setDuration(123454321);
                // Neither model should have changed
                expect(testModel).toEqual(initialModel);
                expect(mutationModel).toEqual(initialModel);
            });
        });
    }
);