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

define(
    ["../src/TelemetryCapability"],
    function (TelemetryCapability) {
        "use strict";

        describe("The telemetry capability", function () {
            var mockInjector,
                mockQ,
                mockLog,
                mockDomainObject,
                mockTelemetryService,
                mockReject,
                mockUnsubscribe,
                telemetry;


            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockInjector = jasmine.createSpyObj("$injector", ["get"]);
                mockQ = jasmine.createSpyObj("$q", ["when", "reject"]);
                mockLog = jasmine.createSpyObj("$log", ["warn", "info", "debug"]);
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "getModel" ]
                );
                mockTelemetryService = jasmine.createSpyObj(
                    "telemetryService",
                    [ "requestTelemetry", "subscribe" ]
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

                telemetry = new TelemetryCapability(
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
                        start: 42 // from argument
                    }]);

            });

            it("provides an empty series when telemetry is missing", function () {
                var series;
                mockTelemetryService.requestTelemetry.andReturn(mockPromise({}));
                telemetry.requestData({}).then(function (s) { series = s; });
                expect(series.getPointCount()).toEqual(0);
            });

            it("provides telemetry metadata", function () {
                expect(telemetry.getMetadata()).toEqual({
                    id: "testId", // from domain object
                    source: "testSource",
                    key: "testKey"
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
                    key: "testId" // from domain object
                });
            });


            it("warns if no telemetry service can be injected", function () {
                mockInjector.get.andCallFake(function () { throw ""; });

                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                telemetry.requestData();

                expect(mockLog.warn).toHaveBeenCalled();
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
                        key: "testKey"
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
        });
    }
);
