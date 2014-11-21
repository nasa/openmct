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