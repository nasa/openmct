/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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


define(
    ['../../src/controllers/TimelineZoomController'],
    function (TimelineZoomController) {

        describe("The timeline zoom state controller", function () {
            var testConfiguration,
                mockScope,
                controller;

            beforeEach(function () {
                testConfiguration = {
                    levels: [1000, 2000, 3500],
                    width: 12321
                };
                mockScope = jasmine.createSpyObj("$scope", ['$watch']);
                mockScope.commit = jasmine.createSpy('commit');
                controller = new TimelineZoomController(
                    mockScope,
                    testConfiguration
                );
            });

            it("starts off at a middle zoom level", function () {
                expect(controller.zoom()).toEqual(2000);
            });

            it("handles time-to-pixel conversions", function () {
                var zoomLevel = controller.zoom();
                expect(controller.toPixels(zoomLevel)).toEqual(12321);
                expect(controller.toPixels(zoomLevel * 2)).toEqual(24642);
            });

            it("handles pixel-to-time conversions", function () {
                var zoomLevel = controller.zoom();
                expect(controller.toMillis(12321)).toEqual(zoomLevel);
                expect(controller.toMillis(24642)).toEqual(zoomLevel * 2);
            });

            it("allows zoom to be changed", function () {
                controller.zoom(1);
                expect(controller.zoom()).toEqual(3500);
            });

            it("observes scroll bounds", function () {
                expect(mockScope.$watch)
                    .toHaveBeenCalledWith("scroll", jasmine.any(Function));
            });

            describe("when watches have fired", function () {
                var mockDomainObject,
                    mockPromise,
                    mockTimespan,
                    testStart,
                    testEnd;

                beforeEach(function () {
                    testStart = 3000;
                    testEnd = 5500;

                    mockDomainObject = jasmine.createSpyObj('domainObject', [
                        'getId',
                        'getModel',
                        'getCapability',
                        'useCapability'
                    ]);
                    mockPromise = jasmine.createSpyObj('promise', ['then']);
                    mockTimespan = jasmine.createSpyObj('timespan', [
                        'getStart',
                        'getEnd',
                        'getDuration'
                    ]);

                    mockDomainObject.useCapability.andCallFake(function (c) {
                        return c === 'timespan' && mockPromise;
                    });
                    mockPromise.then.andCallFake(function (callback) {
                        callback(mockTimespan);
                    });
                    mockTimespan.getStart.andReturn(testStart);
                    mockTimespan.getEnd.andReturn(testEnd);
                    mockTimespan.getDuration.andReturn(testEnd - testStart);

                    mockScope.scroll = { x: 0, width: 20000 };
                    mockScope.domainObject = mockDomainObject;

                    mockScope.$watch.calls.forEach(function (call) {
                        call.args[1](mockScope[call.args[0]]);
                    });
                });

                it("zooms to fit the timeline", function () {
                    var x1 = mockScope.scroll.x,
                        x2 = mockScope.scroll.x + mockScope.scroll.width;
                    expect(Math.round(controller.toMillis(x1)))
                        .toEqual(testStart);
                    expect(Math.round(controller.toMillis(x2)))
                        .toBeGreaterThan(testEnd);
                });

                it("provides a width which is not less than scroll area width", function () {
                    var testPixel = mockScope.scroll.width / 4,
                        testMillis = controller.toMillis(testPixel);
                    expect(controller.width(testMillis))
                        .toEqual(mockScope.scroll.width);
                });

                it("provides a width with some margin past timestamp", function () {
                    var testPixel = mockScope.scroll.width * 4,
                        testMillis = controller.toMillis(testPixel);
                    expect(controller.width(testMillis))
                        .toBeGreaterThan(controller.toPixels(testMillis));
                });

                it("provides a width which does not greatly exceed timestamp", function () {
                    var testPixel = mockScope.scroll.width * 4,
                        testMillis = controller.toMillis(testPixel);
                    expect(controller.width(testMillis))
                        .toBeLessThan(controller.toPixels(testMillis * 2));
                });
            });

        });

    }
);
