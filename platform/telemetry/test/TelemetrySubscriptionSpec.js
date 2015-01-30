/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/TelemetrySubscription"],
    function (TelemetrySubscription) {
        "use strict";

        describe("A telemetry subscription", function () {
            var mockQ,
                mockTimeout,
                mockDomainObject,
                mockCallback,
                mockTelemetry,
                mockUnsubscribe,
                mockSeries,
                subscription;

            function mockPromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ["when", "all"]);
                mockTimeout = jasmine.createSpy("$timeout");
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getCapability", "useCapability", "hasCapability", "getId" ]
                );
                mockCallback = jasmine.createSpy("callback");
                mockTelemetry = jasmine.createSpyObj(
                    "telemetry",
                    ["subscribe", "getMetadata"]
                );
                mockUnsubscribe = jasmine.createSpy("unsubscribe");
                mockSeries = jasmine.createSpyObj(
                    "series",
                    [ "getPointCount", "getDomainValue", "getRangeValue" ]
                );

                mockQ.when.andCallFake(mockPromise);

                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.getCapability.andReturn(mockTelemetry);
                mockDomainObject.getId.andReturn('test-id');

                mockTelemetry.subscribe.andReturn(mockUnsubscribe);

                mockSeries.getPointCount.andReturn(42);
                mockSeries.getDomainValue.andReturn(123456);
                mockSeries.getRangeValue.andReturn(789);

                subscription = new TelemetrySubscription(
                    mockQ,
                    mockTimeout,
                    mockDomainObject,
                    mockCallback
                );
            });

            it("subscribes to the provided object", function () {
                expect(mockTelemetry.subscribe).toHaveBeenCalled();
            });

            it("unsubscribes on request", function () {
                expect(mockUnsubscribe).not.toHaveBeenCalled();
                subscription.unsubscribe();
                expect(mockUnsubscribe).toHaveBeenCalled();
            });

            it("fires callbacks when subscriptions update", function () {
                expect(mockCallback).not.toHaveBeenCalled();
                mockTelemetry.subscribe.mostRecentCall.args[0](mockSeries);
                // This gets fired via a timeout, so trigger that
                expect(mockTimeout).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    0
                );
                mockTimeout.mostRecentCall.args[0]();
                // Should have triggered the callback to alert that
                // new data was available
                expect(mockCallback).toHaveBeenCalled();
            });

            it("fires subscription callbacks once per cycle", function () {
                var i;

                for (i = 0; i < 100; i += 1) {
                    mockTelemetry.subscribe.mostRecentCall.args[0](mockSeries);
                }
                // This gets fired via a timeout, so trigger any of those
                mockTimeout.calls.forEach(function (call) {
                    call.args[0]();
                });
                // Should have only triggered the
                expect(mockCallback.calls.length).toEqual(1);
            });

            it("reports its latest observed data values", function () {
                mockTelemetry.subscribe.mostRecentCall.args[0](mockSeries);
                // This gets fired via a timeout, so trigger that
                mockTimeout.mostRecentCall.args[0]();
                // Verify that the last sample was looked at
                expect(mockSeries.getDomainValue).toHaveBeenCalledWith(41);
                expect(mockSeries.getRangeValue).toHaveBeenCalledWith(41);
                // Domain and range values should now be available
                expect(subscription.getDomainValue(mockDomainObject))
                    .toEqual(123456);
                expect(subscription.getRangeValue(mockDomainObject))
                    .toEqual(789);
            });

            it("provides no objects if no domain object is provided", function () {
                // omit last arguments
                subscription = new TelemetrySubscription(mockQ, mockTimeout);

                // Should have no objects
                expect(subscription.getTelemetryObjects()).toEqual([]);
            });

            // This test case corresponds to plot usage of
            // telemetrySubscription, where failure to callback
            // once-per-update results in loss of data, WTD-784
            it("fires one event per update if requested", function () {
                var i, domains = [], ranges = [], lastCall;

                // Clear out the subscription from beforeEach
                subscription.unsubscribe();
                // Create a subscription which does not drop events
                subscription = new TelemetrySubscription(
                    mockQ,
                    mockTimeout,
                    mockDomainObject,
                    mockCallback,
                    true // Don't drop updates!
                );

                // Snapshot getDomainValue, getRangeValue at time of callback
                mockCallback.andCallFake(function () {
                    domains.push(subscription.getDomainValue(mockDomainObject));
                    ranges.push(subscription.getRangeValue(mockDomainObject));
                });

                // Send 100 updates
                for (i = 0; i < 100; i += 1) {
                    // Return different values to verify later
                    mockSeries.getDomainValue.andReturn(i);
                    mockSeries.getRangeValue.andReturn(i * 2);
                    mockTelemetry.subscribe.mostRecentCall.args[0](mockSeries);
                }

                // Fire all timeouts that get scheduled
                while (mockTimeout.mostRecentCall !== lastCall) {
                    lastCall = mockTimeout.mostRecentCall;
                    lastCall.args[0]();
                }

                // Should have only triggered the
                expect(mockCallback.calls.length).toEqual(100);
            });
        });
    }
);