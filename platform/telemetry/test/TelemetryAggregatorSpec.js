/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/TelemetryAggregator"],
    function (TelemetryAggregator) {
        "use strict";

        describe("The telemetry aggregator", function () {
            var mockQ,
                mockProviders,
                aggregator;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            function mockProvider(key, index) {
                var provider = jasmine.createSpyObj(
                    "provider" + index,
                    [ "requestTelemetry" ]
                );
                provider.requestTelemetry.andReturn({ someKey: key });
                return provider;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", [ "all" ]);
                mockQ.all.andReturn(mockPromise([]));

                mockProviders = [ "a", "b", "c" ].map(mockProvider);

                aggregator = new TelemetryAggregator(mockQ, mockProviders);
            });

            it("passes requests to aggregated providers", function () {
                var requests = [
                    { someKey: "some value" },
                    { someKey: "some other value" }
                ];

                aggregator.requestTelemetry(requests);

                mockProviders.forEach(function (mockProvider) {
                    expect(mockProvider.requestTelemetry)
                        .toHaveBeenCalledWith(requests);
                });
            });

            it("merges results from all providers", function () {
                var capture = jasmine.createSpy("capture");

                mockQ.all.andReturn(mockPromise([
                    { someKey: "some value" },
                    { someOtherKey: "some other value" }
                ]));

                aggregator.requestTelemetry().then(capture);

                // Verify that aggregator results were run through
                // $q.all
                expect(mockQ.all).toHaveBeenCalledWith([
                    { someKey: 'a' },
                    { someKey: 'b' },
                    { someKey: 'c' }
                ]);

                expect(capture).toHaveBeenCalledWith({
                    someKey: "some value",
                    someOtherKey: "some other value"
                });
            });


        });
    }
);