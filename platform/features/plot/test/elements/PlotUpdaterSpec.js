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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine,Float32Array*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/elements/PlotUpdater"],
    function (PlotUpdater) {
        "use strict";

        describe("A plot updater", function () {
            var mockSubscription,
                testDomain,
                testRange,
                testDomainValues,
                testRangeValues,
                mockSeries,
                updater;

            function makeMockDomainObject(id) {
                var mockDomainObject = jasmine.createSpyObj(
                    "object-" + id,
                    [ "getId", "getCapability", "getModel" ]
                );
                mockDomainObject.getId.andReturn(id);
                return mockDomainObject;
            }

            beforeEach(function () {
                var ids = [ 'a', 'b', 'c' ],
                    mockObjects = ids.map(makeMockDomainObject);

                mockSubscription = jasmine.createSpyObj(
                    "subscription",
                    [ "getDomainValue", "getRangeValue", "getTelemetryObjects" ]
                );
                mockSeries = jasmine.createSpyObj(
                    'series',
                    ['getPointCount', 'getDomainValue', 'getRangeValue']
                );
                testDomain = "testDomain";
                testRange = "testRange";
                testDomainValues = { a: 3, b: 7, c: 13 };
                testRangeValues = { a: 123, b: 456, c: 789 };

                mockSubscription.getTelemetryObjects.andReturn(mockObjects);
                mockSubscription.getDomainValue.andCallFake(function (mockObject) {
                    return testDomainValues[mockObject.getId()];
                });
                mockSubscription.getRangeValue.andCallFake(function (mockObject) {
                    return testRangeValues[mockObject.getId()];
                });

                updater = new PlotUpdater(
                    mockSubscription,
                    testDomain,
                    testRange,
                    1350 // Smaller max size for easier testing
                );
            });

            it("provides one buffer per telemetry object", function () {
                expect(updater.getLineBuffers().length).toEqual(3);
            });

            it("changes buffer count if telemetry object counts change", function () {
                mockSubscription.getTelemetryObjects
                    .andReturn([makeMockDomainObject('a')]);
                updater.update();
                expect(updater.getLineBuffers().length).toEqual(1);
            });

            it("can handle delayed telemetry object availability", function () {
                // The case can occur where getTelemetryObjects() returns an
                // empty array - specifically, while objects are still being
                // loaded. The updater needs to be able to cope with that
                // case.
                var tmp = mockSubscription.getTelemetryObjects();
                mockSubscription.getTelemetryObjects.andReturn([]);

                // Reinstantiate with the empty subscription
                updater = new PlotUpdater(
                    mockSubscription,
                    testDomain,
                    testRange
                );

                // Should have 0 buffers for 0 objects
                expect(updater.getLineBuffers().length).toEqual(0);

                // Restore the three objects the test subscription would
                // normally have.
                mockSubscription.getTelemetryObjects.andReturn(tmp);
                updater.update();

                // Should have 3 buffers for 3 objects
                expect(updater.getLineBuffers().length).toEqual(3);
            });

            it("accepts historical telemetry updates", function () {
                var mockObject = mockSubscription.getTelemetryObjects()[0];

                mockSeries.getPointCount.andReturn(3);
                mockSeries.getDomainValue.andCallFake(function (i) {
                    return 1000 + i * 1000;
                });
                mockSeries.getRangeValue.andReturn(10);

                // PlotLine & PlotLineBuffer are tested for most of the
                // details here, so just check for some expected side
                // effect; in this case, should see more points in the buffer
                expect(updater.getLineBuffers()[0].getLength()).toEqual(1);
                updater.addHistorical(mockObject, mockSeries);
                expect(updater.getLineBuffers()[0].getLength()).toEqual(4);
            });

            it("clears the domain offset if no objects are present", function () {
                mockSubscription.getTelemetryObjects.andReturn([]);
                updater.update();
                expect(updater.getDomainOffset()).toBeUndefined();
            });

            it("handles empty historical telemetry updates", function () {
                // General robustness check for when a series is empty
                var mockObject = mockSubscription.getTelemetryObjects()[0];

                mockSeries.getPointCount.andReturn(0);
                mockSeries.getDomainValue.andCallFake(function (i) {
                    return 1000 + i * 1000;
                });
                mockSeries.getRangeValue.andReturn(10);

                // PlotLine & PlotLineBuffer are tested for most of the
                // details here, so just check for some expected side
                // effect; in this case, should see more points in the buffer
                expect(updater.getLineBuffers()[0].getLength()).toEqual(1);
                updater.addHistorical(mockObject, mockSeries);
                expect(updater.getLineBuffers()[0].getLength()).toEqual(1);
            });

            it("can initialize domain offset from historical telemetry", function () {
                var tmp = mockSubscription.getTelemetryObjects();

                mockSubscription.getTelemetryObjects.andReturn([]);

                // Reinstantiate with the empty subscription
                updater = new PlotUpdater(
                    mockSubscription,
                    testDomain,
                    testRange
                );

                // Restore subscription, provide some historical data
                mockSubscription.getTelemetryObjects.andReturn(tmp);
                mockSeries.getPointCount.andReturn(3);
                mockSeries.getDomainValue.andCallFake(function (i) {
                    return 1000 + i * 1000;
                });
                mockSeries.getRangeValue.andReturn(10);

                // PlotLine & PlotLineBuffer are tested for most of the
                // details here, so just check for some expected side
                // effect; in this case, should see more points in the buffer
                expect(updater.getDomainOffset()).toBeUndefined();
                updater.addHistorical(tmp[0], mockSeries);
                expect(updater.getDomainOffset()).toBeDefined();
            });

            it("provides some margin for the range", function () {
                var mockObject = mockSubscription.getTelemetryObjects()[0];

                mockSeries.getPointCount.andReturn(3);
                mockSeries.getDomainValue.andCallFake(function (i) {
                    return 1000 + i * 1000;
                });
                mockSeries.getRangeValue.andCallFake(function (i) {
                    return 10 + i; // 10, 20, 30
                });
                updater.addHistorical(mockObject, mockSeries);
                expect(updater.getOrigin()[1]).toBeLessThan(10);
                expect(updater.getDimensions()[1]).toBeGreaterThan(20);
            });

            describe("when no data is initially available", function () {
                beforeEach(function () {
                    testDomainValues = {};
                    testRangeValues = {};
                    updater = new PlotUpdater(
                        mockSubscription,
                        testDomain,
                        testRange,
                        1350 // Smaller max size for easier testing
                    );
                });

                it("has no line data", function () {
                    // Either no lines, or empty lines are fine
                    expect(updater.getLineBuffers().map(function (lineBuffer) {
                        return lineBuffer.getLength();
                    }).reduce(function (a, b) {
                        return a + b;
                    }, 0)).toEqual(0);
                });

                it("determines initial domain bounds from first available data", function () {
                    testDomainValues.a = 123;
                    testRangeValues.a = 456;
                    updater.update();
                    expect(updater.getOrigin()[0]).toEqual(jasmine.any(Number));
                    expect(updater.getOrigin()[1]).toEqual(jasmine.any(Number));
                    expect(isNaN(updater.getOrigin()[0])).toBeFalsy();
                    expect(isNaN(updater.getOrigin()[1])).toBeFalsy();
                });
            });

        });
    }
);
