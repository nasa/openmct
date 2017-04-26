/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    ["../src/TelemetryCapability"],
    function (TelemetryCapability) {

        describe("The telemetry capability", function () {
            var mockInjector,
                mockQ,
                mockLog,
                mockDomainObject,
                mockTelemetryService,
                mockReject,
                mockUnsubscribe,
                telemetry,
                mockTelemetryAPI,
                mockAPI;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            function noop() {
            }

            beforeEach(function () {
                mockInjector = jasmine.createSpyObj("$injector", ["get"]);
                mockQ = jasmine.createSpyObj("$q", ["when", "reject"]);
                mockLog = jasmine.createSpyObj("$log", ["warn", "info", "debug"]);
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getId", "getCapability", "getModel"]
                );
                mockTelemetryService = jasmine.createSpyObj(
                    "telemetryService",
                    ["requestTelemetry", "subscribe"]
                );
                mockReject = jasmine.createSpyObj("reject", ["then"]);
                mockUnsubscribe = jasmine.createSpy("unsubscribe");

                mockInjector.get.andReturn(mockTelemetryService);

                mockQ.when.andCallFake(mockPromise);
                mockQ.reject.andReturn(mockReject);

                mockDomainObject.getId.andReturn("testId");
                mockDomainObject.getModel.andReturn({
                    telemetry: {
                        source: "testSource",
                        key: "testKey"
                    }
                });

                mockTelemetryService.requestTelemetry
                    .andReturn(mockPromise({}));
                mockTelemetryService.subscribe
                    .andReturn(mockUnsubscribe);

                // Bubble up...
                mockReject.then.andReturn(mockReject);

                mockTelemetryAPI = jasmine.createSpyObj("telemetryAPI", [
                    "getMetadata",
                    "subscribe",
                    "request",
                    "findRequestProvider",
                    "findSubscriptionProvider"
                ]);
                mockTelemetryAPI.getMetadata.andReturn({
                    valuesForHints: function () {
                        return [];
                    }
                });

                mockAPI = {
                    telemetry: mockTelemetryAPI,
                    conductor: {
                        bounds: function () {
                            return {
                                start: 0,
                                end: 1
                            };
                        },
                        timeSystem: function () {
                            return {
                                metadata: {
                                    key: 'mockTimeSystem'
                                }
                            };
                        }
                    }
                };

                telemetry = new TelemetryCapability(
                    mockAPI,
                    mockInjector,
                    mockQ,
                    mockLog,
                    mockDomainObject
                );
            });

            it("applies only to objects with telemetry sources", function () {
                expect(TelemetryCapability.appliesTo({
                    telemetry: { source: "testSource" }
                })).toBeTruthy();
                expect(TelemetryCapability.appliesTo({
                    xtelemetry: { source: "testSource" }
                })).toBeFalsy();
                expect(TelemetryCapability.appliesTo({})).toBeFalsy();
                expect(TelemetryCapability.appliesTo()).toBeFalsy();
            });

            it("gets a telemetry service from the injector", function () {
                telemetry.requestData();
                expect(mockInjector.get)
                    .toHaveBeenCalledWith("telemetryService");
            });

            it("applies request arguments", function () {
                telemetry.requestData({ start: 42 });
                expect(mockTelemetryService.requestTelemetry)
                    .toHaveBeenCalledWith([{
                        id: "testId", // from domain object
                        source: "testSource", // from model
                        key: "testKey", // from model
                        start: 42, // from argument
                        domain: 'mockTimeSystem'
                    }]);
            });

            it("provides an empty series when telemetry is missing", function () {
                var series;
                mockTelemetryService.requestTelemetry.andReturn(mockPromise({}));
                telemetry.requestData({}).then(function (s) {
                    series = s;
                });
                expect(series.getPointCount()).toEqual(0);
            });

            it("provides telemetry metadata", function () {
                expect(telemetry.getMetadata()).toEqual({
                    id: "testId", // from domain object
                    source: "testSource",
                    key: "testKey",
                    start: 0,
                    end: 1,
                    domain: 'mockTimeSystem'
                });
            });

            it("uses domain object as a key if needed", function () {
                // Don't include key in telemetry
                mockDomainObject.getModel.andReturn({
                    telemetry: { source: "testSource" }
                });

                // Should have used the domain object's ID
                expect(telemetry.getMetadata()).toEqual({
                    id: "testId", // from domain object
                    source: "testSource", // from model
                    key: "testId", // from domain object
                    start: 0,
                    end: 1,
                    domain: 'mockTimeSystem'
                });
            });


            it("warns if no telemetry service can be injected", function () {
                mockInjector.get.andCallFake(function () {
                    throw "";
                });

                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                telemetry.requestData();

                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("if a new style telemetry source is available, use it", function () {
                var mockProvider = {};
                mockTelemetryAPI.findSubscriptionProvider.andReturn(mockProvider);
                telemetry.subscribe(noop, {});
                expect(mockTelemetryService.subscribe).not.toHaveBeenCalled();
                expect(mockTelemetryAPI.subscribe).toHaveBeenCalled();
            });

            it("if a new style telemetry source is not available, revert to old API", function () {
                mockTelemetryAPI.findSubscriptionProvider.andReturn(undefined);
                telemetry.subscribe(noop, {});
                expect(mockTelemetryAPI.subscribe).not.toHaveBeenCalled();
                expect(mockTelemetryService.subscribe).toHaveBeenCalled();
            });

            it("Wraps telemetry returned from the new API as a telemetry series", function () {
                var returnedTelemetry;
                var mockTelemetry = [{
                    prop1: "val1",
                    prop2: "val2",
                    prop3: "val3"
                },
                {
                    prop1: "val4",
                    prop2: "val5",
                    prop3: "val6"
                }];
                var mockProvider = {};
                var dunzo = false;

                mockTelemetryAPI.findRequestProvider.andReturn(mockProvider);
                mockTelemetryAPI.request.andReturn(Promise.resolve(mockTelemetry));

                telemetry.requestData({}).then(function (data) {
                    returnedTelemetry = data;
                    dunzo = true;
                });

                waitsFor(function () {
                    return dunzo;
                });

                runs(function () {
                    expect(returnedTelemetry.getPointCount).toBeDefined();
                    expect(returnedTelemetry.getDomainValue).toBeDefined();
                    expect(returnedTelemetry.getRangeValue).toBeDefined();
                    expect(returnedTelemetry.getPointCount()).toBe(2);
                });

            });

            it("allows subscriptions to updates", function () {
                var mockCallback = jasmine.createSpy("callback"),
                    subscription = telemetry.subscribe(mockCallback);

                // Verify subscription to the appropriate object
                expect(mockTelemetryService.subscribe).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    [{
                        id: "testId", // from domain object
                        source: "testSource",
                        key: "testKey",
                        start: 0,
                        end: 1,
                        domain: 'mockTimeSystem'
                    }]
                );

                // Check that the callback gets invoked
                expect(mockCallback).not.toHaveBeenCalled();
                mockTelemetryService.subscribe.mostRecentCall.args[0]({
                    testSource: { testKey: { someKey: "some value" } }
                });
                expect(mockCallback).toHaveBeenCalledWith(
                    { someKey: "some value" }
                );

                // Finally, unsubscribe
                expect(mockUnsubscribe).not.toHaveBeenCalled();
                subscription(); // should be an unsubscribe function
                expect(mockUnsubscribe).toHaveBeenCalled();
            });

            it("applies time conductor bounds if request bounds not defined", function () {
                var fullRequest = telemetry.buildRequest({});
                var mockBounds = mockAPI.conductor.bounds();

                expect(fullRequest.start).toBe(mockBounds.start);
                expect(fullRequest.end).toBe(mockBounds.end);

                fullRequest = telemetry.buildRequest({start: 10, end: 20});

                expect(fullRequest.start).toBe(10);
                expect(fullRequest.end).toBe(20);
            });

            it("applies domain from time system if none defined", function () {
                var fullRequest = telemetry.buildRequest({});
                var mockTimeSystem = mockAPI.conductor.timeSystem();
                expect(fullRequest.domain).toBe(mockTimeSystem.metadata.key);

                fullRequest = telemetry.buildRequest({domain: 'someOtherDomain'});
                expect(fullRequest.domain).toBe('someOtherDomain');
            });
        });
    }
);
