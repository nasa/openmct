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
 * ActionAggregatorSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/actions/ActionAggregator"],
    function (ActionAggregator) {
        "use strict";

        describe("Action aggregator", function () {
            var mockAggregators,
                aggregator;

            function createMockActionProvider(actions, i) {
                var spy = jasmine.createSpyObj("agg" + i, [ "getActions" ]);
                spy.getActions.andReturn(actions);
                return spy;
            }

            beforeEach(function () {
                mockAggregators = [
                    ["a", "b"],
                    ["c"],
                    ["d", "e", "f"]
                ].map(createMockActionProvider);
                aggregator = new ActionAggregator(mockAggregators);
            });

            it("consolidates results from aggregated services", function () {
                expect(aggregator.getActions()).toEqual(
                    ["a", "b", "c", "d", "e", "f"]
                );
            });

            it("passes context along to all aggregated services", function () {
                var context = { domainObject: "something" };

                // Verify precondition
                mockAggregators.forEach(function (mockAgg) {
                    expect(mockAgg.getActions).not.toHaveBeenCalled();
                });

                aggregator.getActions(context);

                // All services should have been called with this context
                mockAggregators.forEach(function (mockAgg) {
                    expect(mockAgg.getActions).toHaveBeenCalledWith(context);
                });
            });
        });
    }
);