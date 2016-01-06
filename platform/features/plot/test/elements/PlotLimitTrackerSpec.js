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
    ["../../src/elements/PlotLimitTracker"],
    function (PlotLimitTracker) {
        "use strict";

        describe("A plot's limit tracker", function () {
            var mockHandle,
                testRange,
                mockTelemetryObjects,
                testData,
                mockLimitCapabilities,
                tracker;

            beforeEach(function () {
                testRange = "some-range";
                testData = {};
                mockHandle = jasmine.createSpyObj(
                    'handle',
                    ['getTelemetryObjects', 'getDatum']
                );
                mockTelemetryObjects = ['a', 'b', 'c'].map(function (id, i) {
                    var mockTelemetryObject = jasmine.createSpyObj(
                            'object-' + id,
                            [ 'getId', 'getCapability', 'getModel' ]
                        ),
                        mockLimitCapability = jasmine.createSpyObj(
                            'limit-' + id,
                            [ 'evaluate' ]
                        );
                    testData[id] = { id: id, value: i };
                    mockTelemetryObject.getId.andReturn(id);
                    mockTelemetryObject.getCapability.andCallFake(function (key) {
                        return key === 'limit' && mockLimitCapability;
                    });
                    mockLimitCapability.evaluate
                        .andReturn({ cssClass: 'alarm-' + id});
                    return mockTelemetryObject;
                });
                mockHandle.getTelemetryObjects.andReturn(mockTelemetryObjects);
                mockHandle.getDatum.andCallFake(function (telemetryObject) {
                    return testData[telemetryObject.getId()];
                });

                tracker = new PlotLimitTracker(mockHandle, testRange);
            });

            it("initially provides no limit state", function () {
                mockTelemetryObjects.forEach(function (mockTelemetryObject) {
                    expect(tracker.getLegendClass(mockTelemetryObject))
                        .toBeUndefined();
                });
            });

            describe("when asked to update", function () {
                beforeEach(function () {
                    tracker.update();
                });

                it("evaluates limits using the limit capability", function () {
                    mockTelemetryObjects.forEach(function (mockTelemetryObject) {
                        var id = mockTelemetryObject.getId(),
                            mockLimit =
                                mockTelemetryObject.getCapability('limit');
                        expect(mockLimit.evaluate)
                            .toHaveBeenCalledWith(testData[id], testRange);
                    });
                });

                it("exposes legend classes returned by the limit capability", function () {
                    mockTelemetryObjects.forEach(function (mockTelemetryObject) {
                        var id = mockTelemetryObject.getId();
                        expect(tracker.getLegendClass(mockTelemetryObject))
                            .toEqual('alarm-' + id);
                    });
                });
            });

        });
    }
);
