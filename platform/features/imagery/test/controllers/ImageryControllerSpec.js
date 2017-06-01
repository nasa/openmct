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
    ["../../src/controllers/ImageryController"],
    function (ImageryController) {

        describe("The Imagery controller", function () {
            var $scope,
                openmct,
                oldDomainObject,
                newDomainObject,
                unsubscribe,
                callback,
                controller;

            beforeEach(function () {
                $scope = jasmine.createSpyObj('$scope', ['$on', '$watch']);
                oldDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId']
                );
                newDomainObject = { name: 'foo' };

                oldDomainObject.getId.andReturn('testID');
                openmct = {
                    objects: jasmine.createSpyObj('objectAPI', [
                        'get'
                    ]),
                    time: jasmine.createSpyObj('timeAPI', [
                        'timeSystem'
                    ]),
                    telemetry: jasmine.createSpyObj('telemetryAPI', [
                        'subscribe'
                    ])
                };
                unsubscribe = jasmine.createSpy('unsubscribe');
                openmct.telemetry.subscribe.andReturn(unsubscribe);
                openmct.time.timeSystem.andReturn({
                    key: 'testKey'
                });
                $scope.domainObject = oldDomainObject;
                openmct.objects.get.andReturn(Promise.resolve(newDomainObject));

                controller = new ImageryController(
                    $scope,
                    openmct
                );


//                runs(function () {
//                    callback =
//                        openmct.telemetry.subscribe.mostRecentCall.args[1];
//                });
            });

            it("subscribes to telemetry", function () {
                waitsFor(function () {
                    return !!(openmct.telemetry.subscribe.mostRecentCall);
                });
                expect(openmct.telemetry.subscribe).toHaveBeenCalledWith(
                    newDomainObject,
                    jasmine.any(Function)
                );
            });

            it("unsubscribes when scope is destroyed", function () {
                expect(unsubscribe).not.toHaveBeenCalled();

                // Find the $destroy listener and call it
                $scope.$on.calls.forEach(function (call) {
                    if (call.args[0] === '$destroy') {
                        call.args[1]();
                    }
                });
                expect(unsubscribe).toHaveBeenCalled();
            });

            it("exposes the latest telemetry values", function () {
                // 06/18/2015 4:04am UTC
                var testTimestamp = 1434600258123,
                    testUrl = "some/url",
                    nextTimestamp = 1434600259456, // 4:05.456
                    nextUrl = "some/other/url";

                // Call back with telemetry data
                callback({ timestamp: testTimestamp, value: testUrl });

                expect(controller.getTime()).toEqual("04:04:18.123");
                expect(controller.getDate()).toEqual("2015-06-18");
                expect(controller.getZone()).toEqual("UTC");
                expect(controller.getImageUrl()).toEqual(testUrl);

                callback({ timestamp: nextTimestamp, value: nextUrl });

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

                // Call back with telemetry data
                callback({ timestamp: testTimestamp, value: testUrl });

                expect(controller.getTime()).toEqual("04:04:18.123");
                expect(controller.getDate()).toEqual("2015-06-18");
                expect(controller.getZone()).toEqual("UTC");
                expect(controller.getImageUrl()).toEqual(testUrl);

                expect(controller.paused()).toBeFalsy();
                controller.paused(true); // Pause!
                expect(controller.paused()).toBeTruthy();

                callback({ timestamp: nextTimestamp, value: nextUrl });

                expect(controller.getTime()).toEqual("04:04:18.123");
                expect(controller.getDate()).toEqual("2015-06-18");
                expect(controller.getZone()).toEqual("UTC");
                expect(controller.getImageUrl()).toEqual(testUrl);
            });

            it("initially shows an empty string for date/time", function () {
                // Do not invoke callback...
                expect(controller.getTime()).toEqual("");
                expect(controller.getDate()).toEqual("");
                expect(controller.getZone()).toEqual("");
                expect(controller.getImageUrl()).toBeUndefined();
            });
        });
    }
);

