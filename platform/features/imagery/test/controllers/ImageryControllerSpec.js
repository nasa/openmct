/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    [
        "zepto",
        "../../src/controllers/ImageryController"
    ],
    function ($, ImageryController) {

        var MOCK_ELEMENT_TEMPLATE =
            '<div class="l-image-thumbs-wrapper"></div>';

        xdescribe("The Imagery controller", function () {
            var $scope,
                openmct,
                oldDomainObject,
                newDomainObject,
                unsubscribe,
                metadata,
                prefix,
                controller,
                requestPromise,
                mockWindow,
                mockElement;

            beforeEach(function () {
                $scope = jasmine.createSpyObj('$scope', ['$on', '$watch']);
                oldDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId']
                );
                newDomainObject = { name: 'foo' };
                oldDomainObject.getId.and.returnValue('testID');
                openmct = {
                    objects: jasmine.createSpyObj('objectAPI', [
                        'get'
                    ]),
                    time: jasmine.createSpyObj('timeAPI', [
                        'timeSystem',
                        'clock',
                        'on',
                        'off',
                        'bounds'
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
                metadata.value.and.returnValue("timestamp");
                metadata.valuesForHints.and.returnValue(["value"]);

                prefix = "formatted ";
                unsubscribe = jasmine.createSpy('unsubscribe');
                openmct.telemetry.subscribe.and.returnValue(unsubscribe);
                openmct.time.timeSystem.and.returnValue({
                    key: 'testKey'
                });
                $scope.domainObject = oldDomainObject;
                openmct.objects.get.and.returnValue(Promise.resolve(newDomainObject));
                openmct.telemetry.getMetadata.and.returnValue(metadata);
                openmct.telemetry.getValueFormatter.and.callFake(function (property) {
                    var formatter =
                        jasmine.createSpyObj("formatter-" + property, ['format']);
                    var isTime = (property === "timestamp");
                    formatter.format.and.callFake(function (datum) {
                        return (isTime ? prefix : "") + datum[property];
                    });
                    return formatter;
                });

                requestPromise = new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve([{
                            timestamp: 1434600258123,
                            value: 'some/url'
                        }]);
                    }, 10);
                });

                openmct.telemetry.request.and.returnValue(requestPromise);
                mockElement = $(MOCK_ELEMENT_TEMPLATE);
                mockWindow = jasmine.createSpyObj('$window', ['requestAnimationFrame']);
                mockWindow.requestAnimationFrame.and.callFake(function (f) {
                    return f();
                });

                controller = new ImageryController(
                    $scope,
                    mockWindow,
                    mockElement,
                    openmct
                );
            });

            describe("when loaded", function () {
                var callback,
                    boundsListener,
                    bounds;

                beforeEach(function () {
                    return requestPromise.then(function () {
                        openmct.time.on.calls.all().forEach(function (call) {
                            if (call.args[0] === "bounds") {
                                boundsListener = call.args[1];
                            }
                        });
                        callback =
                            openmct.telemetry.subscribe.calls.mostRecent().args[1];
                    });
                });

                it("requests history", function () {
                    expect(openmct.telemetry.request).toHaveBeenCalledWith(
                        newDomainObject, bounds
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

                it("forwards large image view to latest image in history on un-pause", function () {
                    $scope.imageHistory = [
                        { utc: 1434600258122, url: 'some/url1', selected: false},
                        { utc: 1434600258123, url: 'some/url2', selected: false}
                    ];
                    controller.paused(true);
                    controller.paused(false);

                    expect(controller.getImageUrl()).toEqual(controller.getImageUrl($scope.imageHistory[1]));
                });

                it("subscribes to telemetry", function () {
                    expect(openmct.telemetry.subscribe).toHaveBeenCalledWith(
                        newDomainObject,
                        jasmine.any(Function)
                    );
                });

                it("requests telemetry", function () {
                    expect(openmct.telemetry.request).toHaveBeenCalledWith(
                        newDomainObject,
                        bounds
                    );
                });

                it("unsubscribes and unlistens when scope is destroyed", function () {
                    expect(unsubscribe).not.toHaveBeenCalled();

                    $scope.$on.calls.all().forEach(function (call) {
                        if (call.args[0] === '$destroy') {
                            call.args[1]();
                        }
                    });
                    expect(unsubscribe).toHaveBeenCalled();
                    expect(openmct.time.off)
                        .toHaveBeenCalledWith('bounds', jasmine.any(Function));
                });

                it("listens for bounds event and responds to tick and manual change", function () {
                    var mockBounds = {start: 1434600000000, end: 1434600500000};
                    expect(openmct.time.on).toHaveBeenCalled();
                    openmct.telemetry.request.calls.reset();
                    boundsListener(mockBounds, true);
                    expect(openmct.telemetry.request).not.toHaveBeenCalled();
                    boundsListener(mockBounds, false);
                    expect(openmct.telemetry.request).toHaveBeenCalledWith(newDomainObject, mockBounds);
                });

                it ("doesnt append duplicate datum", function () {
                    var mockDatum  = {value: 'image/url', timestamp: 1434700000000};
                    var mockDatum2 = {value: 'image/url', timestamp: 1434700000000};
                    var mockDatum3 = {value: 'image/url', url: 'someval', timestamp: 1434700000000};
                    expect(controller.updateHistory(mockDatum)).toBe(true);
                    expect(controller.updateHistory(mockDatum)).toBe(false);
                    expect(controller.updateHistory(mockDatum)).toBe(false);
                    expect(controller.updateHistory(mockDatum2)).toBe(false);
                    expect(controller.updateHistory(mockDatum3)).toBe(false);
                });

                describe("when user clicks on imagery thumbnail", function () {
                    var mockDatum = { utc: 1434600258123, url: 'some/url', selected: false};

                    it("pauses and adds selected class to imagery thumbnail", function () {
                        controller.setSelectedImage(mockDatum);
                        expect(controller.paused()).toBeTruthy();
                        expect(mockDatum.selected).toBeTruthy();
                    });

                    it("unselects previously selected image", function () {
                        $scope.imageHistory = [{ utc: 1434600258123, url: 'some/url', selected: true}];
                        controller.unselectAllImages();
                        expect($scope.imageHistory[0].selected).toBeFalsy();
                    });

                    it("updates larger image url and time", function () {
                        controller.setSelectedImage(mockDatum);
                        expect(controller.getImageUrl()).toEqual(controller.getImageUrl(mockDatum));
                        expect(controller.getTime()).toEqual(controller.timeFormat.format(mockDatum.utc));
                    });
                });

            });

            it("initially shows an empty string for date/time", function () {
                expect(controller.getTime()).toEqual("");
                expect(controller.getImageUrl()).toEqual("");
            });
        });
    }
);

