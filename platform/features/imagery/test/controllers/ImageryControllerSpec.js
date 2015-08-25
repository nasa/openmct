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
/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ["../../src/controllers/ImageryController"],
    function (ImageryController) {
        "use strict";

        describe("The Imagery controller", function () {
            var mockScope,
                mockTelemetryHandler,
                mockHandle,
                mockDomainObject,
                controller;

            function invokeWatch(expr, value) {
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj('$scope', ['$on', '$watch']);
                mockTelemetryHandler = jasmine.createSpyObj(
                    'telemetryHandler',
                    ['handle']
                );
                mockHandle = jasmine.createSpyObj(
                    'handle',
                    [
                        'getDomainValue',
                        'getRangeValue',
                        'getTelemetryObjects',
                        'unsubscribe'
                    ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getModel', 'getCapability']
                );

                mockTelemetryHandler.handle.andReturn(mockHandle);
                mockHandle.getTelemetryObjects.andReturn([mockDomainObject]);

                controller = new ImageryController(
                    mockScope,
                    mockTelemetryHandler
                );
                invokeWatch('domainObject', mockDomainObject);
            });

            it("unsubscribes when scope is destroyed", function () {
                expect(mockHandle.unsubscribe).not.toHaveBeenCalled();

                // Find the $destroy listener and call it
                mockScope.$on.calls.forEach(function (call) {
                    if (call.args[0] === '$destroy') {
                        call.args[1]();
                    }
                });
                expect(mockHandle.unsubscribe).toHaveBeenCalled();
            });

            it("exposes the latest telemetry values", function () {
                // 06/18/2015 4:04am UTC
                var testTimestamp = 1434600258123,
                    testUrl = "some/url",
                    nextTimestamp = 1434600259456, // 4:05.456
                    nextUrl = "some/other/url";

                mockHandle.getDomainValue.andReturn(testTimestamp);
                mockHandle.getRangeValue.andReturn(testUrl);

                // Call the subscription listener
                mockTelemetryHandler.handle.mostRecentCall.args[1]();

                expect(controller.getTime()).toEqual("04:04:18.123");
                expect(controller.getDate()).toEqual("2015-06-18");
                expect(controller.getZone()).toEqual("UTC");
                expect(controller.getImageUrl()).toEqual(testUrl);

                mockHandle.getDomainValue.andReturn(nextTimestamp);
                mockHandle.getRangeValue.andReturn(nextUrl);
                mockTelemetryHandler.handle.mostRecentCall.args[1]();

                expect(controller.getTime()).toEqual("04:04:19.456");
                expect(controller.getDate()).toEqual("2015-06-18");
                expect(controller.getZone()).toEqual("UTC");
                expect(controller.getImageUrl()).toEqual(nextUrl);
            });

            it("allows updates to be paused", function () {
                // 06/18/2015 4:04am UTC
                var testTimestamp = 1434600258123,
                    testUrl = "some/url",
                    nextTimestamp = 1434600259456, // 4:05.456
                    nextUrl = "some/other/url";

                // As above, but pause in between. Expect details
                // not to change this time

                mockHandle.getDomainValue.andReturn(testTimestamp);
                mockHandle.getRangeValue.andReturn(testUrl);

                // Call the subscription listener
                mockTelemetryHandler.handle.mostRecentCall.args[1]();

                expect(controller.getTime()).toEqual("04:04:18.123");
                expect(controller.getDate()).toEqual("2015-06-18");
                expect(controller.getZone()).toEqual("UTC");
                expect(controller.getImageUrl()).toEqual(testUrl);

                expect(controller.paused()).toBeFalsy();
                controller.paused(true); // Pause!
                expect(controller.paused()).toBeTruthy();

                mockHandle.getDomainValue.andReturn(nextTimestamp);
                mockHandle.getRangeValue.andReturn(nextUrl);
                mockTelemetryHandler.handle.mostRecentCall.args[1]();

                expect(controller.getTime()).toEqual("04:04:18.123");
                expect(controller.getDate()).toEqual("2015-06-18");
                expect(controller.getZone()).toEqual("UTC");
                expect(controller.getImageUrl()).toEqual(testUrl);
            });

            it("initially shows an empty string for date/time", function () {
                // Call the subscription listener while domain/range
                // values are still undefined
                mockHandle.getDomainValue.andReturn(undefined);
                mockHandle.getRangeValue.andReturn(undefined);
                mockTelemetryHandler.handle.mostRecentCall.args[1]();

                // Should have empty strings for date/time/zone
                expect(controller.getTime()).toEqual("");
                expect(controller.getDate()).toEqual("");
                expect(controller.getZone()).toEqual("");
                expect(controller.getImageUrl()).toBeUndefined();
            });
        });
    }
);

