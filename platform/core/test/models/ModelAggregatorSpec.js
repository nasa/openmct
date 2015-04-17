/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * ModelAggregatorSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/models/ModelAggregator"],
    function (ModelAggregator) {
        "use strict";

        describe("The model aggregator", function () {
            var mockQ,
                mockProviders,
                modelList = [
                    { "a": { someKey: "some value" }, "b": undefined },
                    { "b": { someOtherKey: "some other value" }, "a": undefined }
                ],
                aggregator;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", [ "all" ]);
                mockProviders = modelList.map(function (models, i) {
                    var mockProvider = jasmine.createSpyObj(
                        "mockProvider" + i,
                        [ "getModels" ]
                    );
                    mockProvider.getModels.andReturn(models);
                    return mockProvider;
                });

                mockQ.all.andReturn({
                    then: function (c) { return c(modelList); }
                });

                aggregator = new ModelAggregator(mockQ, mockProviders);
            });

            it("aggregates results promised by multiple providers", function () {
                expect(aggregator.getModels(["a", "b"])).toEqual({
                    "a": { someKey: "some value" },
                    "b": { someOtherKey: "some other value" }
                });
            });

            it("passes ids to all aggregated providers", function () {
                aggregator.getModels(["a", "b"]);

                mockProviders.forEach(function (mockProvider) {
                    expect(mockProvider.getModels)
                        .toHaveBeenCalledWith(["a", "b"]);
                });
            });

        });
    }
);