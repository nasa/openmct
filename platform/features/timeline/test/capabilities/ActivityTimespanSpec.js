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
    ['../../src/capabilities/ActivityTimespan'],
    function (ActivityTimespan) {
        'use strict';

        describe("An Activity's timespan", function () {
            var testModel,
                mutatorModel,
                mockMutation,
                timespan;

            beforeEach(function () {
                testModel = {
                    start: {
                        timestamp: 42000,
                        epoch: "TEST"
                    },
                    duration: {
                        timestamp: 12321
                    }
                };
                // Provide a cloned model for mutation purposes
                // It is important to distinguish mutation made to
                // the model provided via the mutation capability from
                // changes made to the model directly (the latter is
                // not intended usage.)
                mutatorModel = JSON.parse(JSON.stringify(testModel));
                mockMutation = jasmine.createSpyObj("mutation", ["mutate"]);
                mockMutation.mutate.andCallFake(function (mutator) {
                    mutator(mutatorModel);
                });
                timespan = new ActivityTimespan(testModel, mockMutation);
            });

            it("provides a start time", function () {
                expect(timespan.getStart()).toEqual(42000);
            });

            it("provides an end time", function () {
                expect(timespan.getEnd()).toEqual(54321);
            });

            it("provides duration", function () {
                expect(timespan.getDuration()).toEqual(12321);
            });

            it("provides an epoch", function () {
                expect(timespan.getEpoch()).toEqual("TEST");
            });

            it("sets start time using mutation capability", function () {
                timespan.setStart(52000);
                expect(mutatorModel.start.timestamp).toEqual(52000);
                // Should have also changed duration to preserve end
                expect(mutatorModel.duration.timestamp).toEqual(2321);
                // Original model should still be the same
                expect(testModel.start.timestamp).toEqual(42000);
            });

            it("sets end time using mutation capability", function () {
                timespan.setEnd(44000);
                // Should have also changed duration to preserve end
                expect(mutatorModel.duration.timestamp).toEqual(2000);
                // Original model should still be the same
                expect(testModel.duration.timestamp).toEqual(12321);
            });

            it("sets duration using mutation capability", function () {
                timespan.setDuration(8000);
                // Should have also changed duration to preserve end
                expect(mutatorModel.duration.timestamp).toEqual(8000);
                // Original model should still be the same
                expect(testModel.duration.timestamp).toEqual(12321);
            });

        });
    }
);