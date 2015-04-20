/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/TelemetryHandle"],
    function (TelemetryHandle) {
        "use strict";

        describe("A telemetry handle", function () {
            var mockQ,
                mockSubscription,
                mockDomainObject,
                mockTelemetry,
                mockSeries,
                mockCallback,
                handle;

            function asPromise(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return asPromise(callback(v));
                    }
                };
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['when', 'all']);
                mockSubscription = jasmine.createSpyObj(
                    'subscription',
                    ['unsubscribe', 'getTelemetryObjects', 'promiseTelemetryObjects']
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getCapability']
                );
                mockTelemetry = jasmine.createSpyObj(
                    'telemetry',
                    ['requestData']
                );
                mockSeries = jasmine.createSpyObj(
                    'series',
                    ['getPointCount', 'getDomainValue', 'getRangeValue']
                );
                mockCallback = jasmine.createSpy('callback');

                // Simulate $q.all, at least for asPromise-provided promises
                mockQ.all.andCallFake(function (values) {
                    return values.map(function (v) {
                        var r;
                        asPromise(v).then(function (value) { r = value; });
                        return r;
                    });
                });
                mockQ.when.andCallFake(asPromise);
                mockSubscription.getTelemetryObjects
                    .andReturn([mockDomainObject]);
                mockSubscription.promiseTelemetryObjects
                    .andReturn(asPromise([mockDomainObject]));
                mockDomainObject.getId.andReturn('testId');
                mockDomainObject.getCapability.andReturn(mockTelemetry);
                mockTelemetry.requestData.andReturn(asPromise(mockSeries));

                handle = new TelemetryHandle(mockQ, mockSubscription);
            });

            it("exposes subscription API", function () {
                // Should still expose methods from the provided subscription
                expect(handle.unsubscribe)
                    .toBe(mockSubscription.unsubscribe);
                expect(handle.getTelemetryObjects)
                    .toBe(mockSubscription.getTelemetryObjects);
            });

            it("provides an interface for historical requests", function () {
                handle.request({}, mockCallback);
                expect(mockCallback).toHaveBeenCalledWith(
                    mockDomainObject,
                    mockSeries
                );
            });

            it("provides the latest series for domain objects", function () {
                handle.request({});
                expect(handle.getSeries(mockDomainObject))
                    .toEqual(mockSeries);
            });
        });
    }
);
