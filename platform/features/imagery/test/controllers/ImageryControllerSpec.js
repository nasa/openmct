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
                metadata,
                prefix,
                controller,
                hasLoaded;

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
                        'subscribe',
                        'request',
                        'getValueFormatter',
                        'getMetadata'
                    ])
                };
                metadata = jasmine.createSpyObj('metadata', [
                    'value',
                    'valuesForHints'
                ]);
                prefix = "formatted ";
                unsubscribe = jasmine.createSpy('unsubscribe');
                openmct.telemetry.subscribe.andReturn(unsubscribe);
                openmct.time.timeSystem.andReturn({
                    key: 'testKey'
                });
                $scope.domainObject = oldDomainObject;
                openmct.objects.get.andReturn(Promise.resolve(newDomainObject));
                openmct.telemetry.getMetadata.andReturn(metadata);
                openmct.telemetry.getValueFormatter.andCallFake(function (property) {
                    var formatter =
                        jasmine.createSpyObj("formatter-" + property, ['format']);
                    var isTime = (property === "timestamp");
                    formatter.format.andCallFake(function (datum) {
                        return (isTime ? prefix : "") + datum[property];
                    });
                    return formatter;
                });
                hasLoaded = false;
                openmct.telemetry.request.andCallFake(function () {
                    setTimeout(function () {
                        hasLoaded = true;
                    }, 10);
                    return Promise.resolve([{
                            timestamp: 1434600258123,
                            value: 'some/url'
                        }]);
                });
                metadata.value.andReturn("timestamp");
                metadata.valuesForHints.andReturn(["value"]);

                controller = new ImageryController($scope, openmct);

            });

            describe("when loaded", function () {
                var callback;
                beforeEach(function () {
                    waitsFor(function () {
                        return hasLoaded;
                    }, 500);


                    runs(function () {
                        callback =
                            openmct.telemetry.subscribe.mostRecentCall.args[1];
                    });
                });


                it("uses LAD telemetry", function () {
                    expect(openmct.telemetry.request).toHaveBeenCalledWith(
                        newDomainObject,
                        {
                            strategy: 'latest',
                            size: 1
                        }
                    );
                    expect(controller.getTime()).toEqual(prefix + 1434600258123);
                    expect(controller.getImageUrl()).toEqual('some/url');
                });


                it("exposes the latest telemetry values", function () {
                    callback({
                        timestamp: 1434600259456,
                        value: "some/other/url"
                    });

                    expect(controller.getTime()).toEqual(prefix + 1434600259456);
                    expect(controller.getImageUrl()).toEqual("some/other/url");
                });

                it("allows updates to be paused and unpaused", function () {
                    var newTimestamp = 1434600259456,
                        newUrl = "some/other/url",
                        initialTimestamp = controller.getTime(),
                        initialUrl = controller.getImageUrl();

                    expect(initialTimestamp).not.toBe(prefix + newTimestamp);
                    expect(initialUrl).not.toBe(newUrl);
                    expect(controller.paused()).toBeFalsy();

                    controller.paused(true);
                    expect(controller.paused()).toBeTruthy();
                    callback({ timestamp: newTimestamp, value: newUrl });

                    expect(controller.getTime()).toEqual(initialTimestamp);
                    expect(controller.getImageUrl()).toEqual(initialUrl);

                    controller.paused(false);
                    expect(controller.paused()).toBeFalsy();
                    expect(controller.getTime()).toEqual(prefix + newTimestamp);
                    expect(controller.getImageUrl()).toEqual(newUrl);
                });

                it("subscribes to telemetry", function () {
                    expect(openmct.telemetry.subscribe).toHaveBeenCalledWith(
                        newDomainObject,
                        jasmine.any(Function)
                    );
                });

                it("unsubscribes when scope is destroyed", function () {
                    expect(unsubscribe).not.toHaveBeenCalled();

                    $scope.$on.calls.forEach(function (call) {
                        if (call.args[0] === '$destroy') {
                            call.args[1]();
                        }
                    });
                    expect(unsubscribe).toHaveBeenCalled();
                });
            });

            it("initially shows an empty string for date/time", function () {
                expect(controller.getTime()).toEqual("");
                expect(controller.getImageUrl()).toEqual("");
            });
        });
    }
);

