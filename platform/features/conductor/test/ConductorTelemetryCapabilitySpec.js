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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 *  EventSpec. Created by vwoeltje on 11/6/14. Modified by shale on 06/23/2015.
 */
define(
    ["../src/ConductorTelemetryCapability"],
    function (ConductorTelemetryCapability) {
        "use strict";

        describe("ConductorTelemetryCapability", function () {
            var mockConductor,
                mockTelemetryCapability,
                mockUnsubscribe,
                testMetadata,
                testStartTime,
                testEndTime,
                conductorTelemetryCapability;

            beforeEach(function () {
                mockConductor = jasmine.createSpyObj(
                    'timeConductor',
                    [
                        'queryStart',
                        'queryEnd',
                        'displayStart',
                        'displayEnd'
                    ]
                );
                mockTelemetryCapability = jasmine.createSpyObj(
                    'telemetry',
                    [ 'getMetadata', 'requestData', 'subscribe' ]
                );
                mockUnsubscribe = jasmine.createSpy('unsubscribe');

                testStartTime = 42;
                testEndTime = 12321;
                testMetadata = { someKey: 'some value' };
                mockTelemetryCapability.getMetadata.andReturn(testMetadata);
                mockTelemetryCapability.subscribe.andReturn(mockUnsubscribe);
                mockConductor.queryStart.andReturn(testStartTime);
                mockConductor.queryEnd.andReturn(testEndTime);

                conductorTelemetryCapability = new ConductorTelemetryCapability(
                    mockConductor,
                    mockTelemetryCapability
                );
            });

            it("simply delegates getMetadata calls", function () {
                expect(conductorTelemetryCapability.getMetadata())
                    .toBe(testMetadata);
            });

            it("adds start/end times to requests", function () {
                conductorTelemetryCapability
                    .requestData({ someKey: "some value" });
                expect(mockTelemetryCapability.requestData).toHaveBeenCalledWith({
                    someKey: "some value",
                    start: testStartTime,
                    end: testEndTime
                });
            });

            it("simply delegates subscribe calls", function () {
                var mockCallback = jasmine.createSpy('callback'),
                    testRequest = { someKey: "some value" };
                expect(conductorTelemetryCapability.subscribe(
                    mockCallback,
                    testRequest
                )).toBe(mockUnsubscribe);
                expect(mockTelemetryCapability.subscribe).toHaveBeenCalledWith(
                    mockCallback,
                    { someKey: "some value" }
                );
            });

        });
    }
);
