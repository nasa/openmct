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
 *  EventSpec. Created by shale on 06/24/2015.
 */
define(
    ["../src/EventListController"],
    function (EventListController) {
        "use strict";

        describe("The event list controller", function () {
            var mockScope,
                mockTelemetry,
                testMetadata,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on", "$watch" ]
                );
                mockTelemetry = jasmine.createSpyObj(
                    "telemetryController",
                    [ "getResponse", "getMetadata", "getTelemetryObjects" ]
                );
                testMetadata = [
                    {
                        domains: [
                            { key: "d0", name: "D0" },
                            { key: "d1", name: "D1" }
                        ],
                        ranges: [
                            { key: "r0", name: "R0" },
                            { key: "r1", name: "R1" }
                        ]
                    },
                    {
                        domains: [
                            { key: "d0", name: "D0" },
                            { key: "d2", name: "D2" }
                        ],
                        ranges: [
                            { key: "r0", name: "R0" }
                        ]
                    }
                ];
                mockTelemetry.getMetadata.andReturn(testMetadata);
                mockTelemetry.getResponse.andReturn([]);
                mockTelemetry.getTelemetryObjects.andReturn([]);
                mockScope.telemetry = mockTelemetry;
                controller = new EventListController(mockScope);
            });

            it("listens for telemetry data updates", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "telemetryUpdate",
                    jasmine.any(Function)
                );
            });

            it("watches for telemetry controller changes", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "telemetry",
                    jasmine.any(Function)
                );
            });

            it("provides a column for each unique domain and range", function () {
                // Should have five columns based on metadata above,
                // (d0, d1, d2, r0, r1)
                mockScope.$watch.mostRecentCall.args[1](mockTelemetry);
                expect(mockScope.headers).toEqual(["D0", "D1", "D2", "R0", "R1"]);
            });

            it("does not throw if telemetry controller is undefined", function () {
                // Just a general robustness check
                mockScope.telemetry = undefined;
                expect(mockScope.$watch.mostRecentCall.args[1])
                    .not.toThrow();
            });

            it("provides default columns if domain/range metadata is unavailable", function () {
                mockTelemetry.getMetadata.andReturn([]);
                mockScope.$watch.mostRecentCall.args[1](mockTelemetry);
                expect(mockScope.headers).toEqual(["Time", "Message"]);
            });
        });
    }
);