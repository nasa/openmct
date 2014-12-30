/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/TelemetrySubscriber"],
    function (TelemetrySubscriber) {
        "use strict";

        describe("The telemetry subscriber", function () {
            // TelemetrySubscriber just provides a factory
            // for TelemetrySubscription, so most real testing
            // should happen there.
            var mockQ,
                mockTimeout,
                mockDomainObject,
                mockCallback,
                mockPromise,
                subscriber;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ["when"]);
                mockTimeout = jasmine.createSpy("$timeout");
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getCapability", "useCapability", "hasCapability" ]
                );
                mockCallback = jasmine.createSpy("callback");
                mockPromise = jasmine.createSpyObj("promise", ["then"]);

                mockQ.when.andReturn(mockPromise);
                mockPromise.then.andReturn(mockPromise);

                subscriber = new TelemetrySubscriber(mockQ, mockTimeout);
            });

            it("acts as a factory for subscription objects", function () {
                var subscription = subscriber.subscribe(
                    mockDomainObject,
                    mockCallback
                );
                // Just verify that this looks like a TelemetrySubscription
                [
                    "unsubscribe",
                    "getTelemetryObjects",
                    "getRangeValue",
                    "getDomainValue"
                ].forEach(function (method) {
                    expect(subscription[method])
                        .toEqual(jasmine.any(Function));
                });
            });

        });
    }
);