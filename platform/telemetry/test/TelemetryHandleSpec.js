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
                    [
                        'makeDatum',
                        'getDatum',
                        'unsubscribe',
                        'getTelemetryObjects',
                        'promiseTelemetryObjects'
                    ]
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
                // (though these may have been wrapped)
                expect(mockSubscription.getTelemetryObjects)
                    .not.toHaveBeenCalled();
                handle.getTelemetryObjects();
                expect(mockSubscription.getTelemetryObjects)
                    .toHaveBeenCalled();

                expect(mockSubscription.unsubscribe)
                    .not.toHaveBeenCalled();
                handle.unsubscribe();
                expect(mockSubscription.unsubscribe)
                    .toHaveBeenCalled();
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

            it("provides access to the datum objects by index", function () {
                var testDatum = { a: 1, b: 2 }, testIndex = 42;
                mockSubscription.makeDatum.andReturn(testDatum);
                handle.request({});
                expect(handle.getDatum(mockDomainObject, testIndex))
                    .toEqual(testDatum);
                expect(mockSubscription.makeDatum)
                    .toHaveBeenCalledWith(
                        mockDomainObject,
                        mockSeries,
                        testIndex
                    );
            });
        });
    }
);
