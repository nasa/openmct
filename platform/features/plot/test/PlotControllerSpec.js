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
/*global define,Promise,describe,it,expect,xit,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/PlotController"],
    function (PlotController) {
        "use strict";

        describe("The plot controller", function () {
            var mockScope,
                mockFormatter,
                mockHandler,
                mockThrottle,
                mockHandle,
                mockDomainObject,
                mockSeries,
                controller;

            function bind(method, thisObj) {
                return function () {
                    return method.apply(thisObj, arguments);
                };
            }

            function fireEvent(name, args) {
                mockScope.$on.calls.forEach(function (call) {
                    if (call.args[0] === name) {
                        call.args[1].apply(null, args || []);
                    }
                });
            }

            function fireWatch(expr, value) {
                mockScope.$watch.calls.forEach(function (call) {
                    if (call.args[0] === expr) {
                        call.args[1].apply(null, [value]);
                    }
                });
            }


            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch", "$on", "$emit" ]
                );
                mockFormatter = jasmine.createSpyObj(
                    "formatter",
                    [ "formatDomainValue", "formatRangeValue" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockHandler = jasmine.createSpyObj(
                    "telemetrySubscriber",
                    ["handle"]
                );
                mockThrottle = jasmine.createSpy("throttle");
                mockHandle = jasmine.createSpyObj(
                    "subscription",
                    [
                        "unsubscribe",
                        "getTelemetryObjects",
                        "getMetadata",
                        "getDomainValue",
                        "getRangeValue",
                        "getDatum",
                        "request"
                    ]
                );
                mockSeries = jasmine.createSpyObj(
                    'series',
                    ['getPointCount', 'getDomainValue', 'getRangeValue']
                );

                mockHandler.handle.andReturn(mockHandle);
                mockThrottle.andCallFake(function (fn) { return fn; });
                mockHandle.getTelemetryObjects.andReturn([mockDomainObject]);
                mockHandle.getMetadata.andReturn([{}]);
                mockHandle.getDomainValue.andReturn(123);
                mockHandle.getRangeValue.andReturn(42);
                mockScope.domainObject = mockDomainObject;

                controller = new PlotController(
                    mockScope,
                    mockFormatter,
                    mockHandler,
                    mockThrottle
                );
            });

            it("provides plot colors", function () {
                // PlotPalette will have its own tests
                expect(controller.getColor(0))
                    .toEqual(jasmine.any(String));

                // Colors should be unique
                expect(controller.getColor(0))
                    .not.toEqual(controller.getColor(1));
            });

            it("subscribes to telemetry when a domain object appears in scope", function () {
                // Make sure we're using the right watch here
                expect(mockScope.$watch.mostRecentCall.args[0])
                    .toEqual("domainObject");
                // Make an object available
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                // Should have subscribed
                expect(mockHandler.handle).toHaveBeenCalledWith(
                    mockDomainObject,
                    jasmine.any(Function),
                    true // Lossless
                );
            });

            it("draws lines when data becomes available", function () {
                // Make an object available
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                // Verify precondition
                controller.getSubPlots().forEach(function (subplot) {
                    expect(subplot.getDrawingObject().lines)
                        .not.toBeDefined();
                });

                // Make sure there actually are subplots being verified
                expect(controller.getSubPlots().length > 0).toBeTruthy();

                // Broadcast data
                mockHandler.handle.mostRecentCall.args[1]();

                controller.getSubPlots().forEach(function (subplot) {
                    expect(subplot.getDrawingObject().lines)
                        .toBeDefined();
                });
            });

            it("unsubscribes when domain object changes", function () {
                // Make an object available
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                // Verify precondition - shouldn't unsubscribe yet
                expect(mockHandle.unsubscribe).not.toHaveBeenCalled();
                // Remove the domain object
                mockScope.$watch.mostRecentCall.args[1](undefined);
                // Should have unsubscribed
                expect(mockHandle.unsubscribe).toHaveBeenCalled();
            });


            it("changes modes depending on number of objects", function () {
                // Act like one object is available
                mockHandle.getTelemetryObjects.andReturn([
                    mockDomainObject
                ]);

                // Make an object available; invoke handler's callback
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                mockHandler.handle.mostRecentCall.args[1]();

                expect(controller.getModeOptions().length).toEqual(1);

                // Act like one object is available
                mockHandle.getTelemetryObjects.andReturn([
                    mockDomainObject,
                    mockDomainObject,
                    mockDomainObject
                ]);

                // Make an object available; invoke handler's callback
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                mockHandler.handle.mostRecentCall.args[1]();

                expect(controller.getModeOptions().length).toEqual(2);
            });

            // Interface tests follow; these will be delegated (mostly
            // to PlotModeOptions, which is tested separately).
            it("provides access to available plot mode options", function () {
                expect(Array.isArray(controller.getModeOptions()))
                    .toBeTruthy();
            });

            it("provides a current plot mode", function () {
                expect(controller.getMode().name)
                    .toEqual(jasmine.any(String));
            });

            it("allows plot mode to be changed", function () {
                expect(function () {
                    controller.setMode(controller.getMode());
                }).not.toThrow();
            });

            it("provides an array of sub-plots", function () {
                expect(Array.isArray(controller.getSubPlots()))
                    .toBeTruthy();
            });

            it("allows plots to be updated", function () {
                expect(bind(controller.update, controller)).not.toThrow();
            });

            it("allows changing pan-zoom state", function () {
                expect(bind(controller.isZoomed, controller)).not.toThrow();
                expect(bind(controller.stepBackPanZoom, controller)).not.toThrow();
                expect(bind(controller.unzoom, controller)).not.toThrow();
            });

            it("indicates if a request is pending", function () {
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(controller.isRequestPending()).toBeTruthy();
                mockHandle.request.mostRecentCall.args[1](
                    mockDomainObject,
                    mockSeries
                );
                expect(controller.isRequestPending()).toBeFalsy();
            });

            it("requests historical telemetry", function () {
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockHandle.request).toHaveBeenCalled();
                mockHandle.request.mostRecentCall.args[1](
                    mockDomainObject,
                    mockSeries
                );
            });

            it("unsubscribes when destroyed", function () {
                // Make an object available
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                // Make sure $destroy is what's listened for
                expect(mockScope.$on.mostRecentCall.args[0]).toEqual('$destroy');
                // Also verify precondition
                expect(mockHandle.unsubscribe).not.toHaveBeenCalled();
                // Destroy the scope
                fireEvent("$destroy");
                // Should have unsubscribed
                expect(mockHandle.unsubscribe).toHaveBeenCalled();
            });

            it("requeries when displayable bounds change", function () {
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockHandle.request.calls.length).toEqual(1);
                fireEvent("telemetry:display:bounds", [
                    {},
                    { start: 10, end: 100 }
                ]);
                expect(mockHandle.request.calls.length).toEqual(2);
            });

            it("requeries when user changes domain selection", function () {
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockHandle.request.calls.length).toEqual(1);
                fireWatch("axes[0].active.key", 'someNewKey');
                expect(mockHandle.request.calls.length).toEqual(2);
            });

            it("requeries when user changes range selection", function () {
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockHandle.request.calls.length).toEqual(1);
                fireWatch("axes[1].active.key", 'someNewKey');
                expect(mockHandle.request.calls.length).toEqual(2);
            });


            it("maintains externally-provided domain axis bounds after data is received", function () {
                mockSeries.getPointCount.andReturn(3);
                mockSeries.getRangeValue.andReturn(42);
                mockSeries.getDomainValue.andCallFake(function (i) {
                    return 2500 + i * 2500;
                });

                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                fireEvent("telemetry:display:bounds", [
                    {},
                    {start: 0, end: 10000}
                ]);
                mockHandle.request.mostRecentCall.args[1](
                    mockDomainObject,
                    mockSeries
                );

                // Pan-zoom state should reflect bounds set externally;
                // domain axis should not have shrunk to fit data.
                expect(
                    controller.getSubPlots()[0].panZoomStack.getOrigin()[0]
                ).toEqual(0);
                expect(
                    controller.getSubPlots()[0].panZoomStack.getDimensions()[0]
                ).toEqual(10000);
            });

            it("provides classes for legends based on limit state", function () {
                var mockTelemetryObjects = mockHandle.getTelemetryObjects();

                mockHandle.getDatum.andReturn({});
                mockTelemetryObjects.forEach(function (mockObject, i) {
                    var id = 'object-' + i,
                        mockLimitCapability =
                            jasmine.createSpyObj('limit-' + id, ['evaluate']);

                    mockObject.getId.andReturn(id);
                    mockObject.getCapability.andCallFake(function (key) {
                        return (key === 'limit') && mockLimitCapability;
                    });

                    mockLimitCapability.evaluate
                        .andReturn({ cssClass: 'alarm-' + id });
                });

                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                mockHandler.handle.mostRecentCall.args[1]();

                mockTelemetryObjects.forEach(function (mockTelemetryObject) {
                    expect(controller.getLegendClass(mockTelemetryObject))
                        .toEqual('alarm-' + mockTelemetryObject.getId());
                });
            });
        });
    }
);
