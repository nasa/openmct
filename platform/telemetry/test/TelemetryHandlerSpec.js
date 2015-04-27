/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/TelemetryHandler"],
    function (TelemetryHandler) {
        "use strict";

        describe("The telemetry handler", function () {
            // TelemetryHandler just provides a factory
            // for TelemetryHandle, so most real testing
            // should happen there.
            var mockQ,
                mockSubscriber,
                mockDomainObject,
                mockCallback,
                mockSubscription,
                handler;

            beforeEach(function () {
                mockQ = jasmine.createSpyObj("$q", ["when"]);
                mockSubscriber = jasmine.createSpyObj(
                    'telemetrySubscriber',
                    ['subscribe']
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getCapability']
                );
                mockCallback = jasmine.createSpy('callback');
                mockSubscription = jasmine.createSpyObj(
                    'subscription',
                    [
                        'unsubscribe',
                        'getTelemetryObjects',
                        'getRangeValue',
                        'getDomainValue'
                    ]
                );

                mockSubscriber.subscribe.andReturn(mockSubscription);

                handler = new TelemetryHandler(mockQ, mockSubscriber);
            });

            it("acts as a factory for subscription objects", function () {
                var handle = handler.handle(
                    mockDomainObject,
                    mockCallback
                );
                // Just verify that this looks like a TelemetrySubscription
                [
                    "unsubscribe",
                    "getTelemetryObjects",
                    "getRangeValue",
                    "getDomainValue",
                    "request"
                ].forEach(function (method) {
                    expect(handle[method]).toEqual(jasmine.any(Function));
                });
            });

        });
    }
);
