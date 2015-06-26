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
 *  RTEventSpec. Created by shale on 06/25/2015.
 */
define(
    ["../src/RTEventListController"],
    function (RTEventListController) {
        "use strict";

        describe("The real time event list controller", function () {
            var mockScope,
                //mockTelemetry,
                mockTelemetryHandler,
                mockHandle,
                mockTelemetryFormatter,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on", "$watch" ]
                );
                mockTelemetryHandler = jasmine.createSpyObj(
                    "telemetryHandler",
                    ["handle"]
                );
                mockHandle = jasmine.createSpyObj(
                    "handle",
                    ["getDomainValue", "getRangeValue"]
                );
                mockTelemetryFormatter = jasmine.createSpyObj(
                    "formatter",
                    ["formatDomainValue", "formatRangeValue"]
                );
                
                controller = new RTEventListController(mockScope, mockTelemetryHandler, mockTelemetryFormatter);
                
                // Add some data into the table
                controller.setUpColumns([{id: 'a'}, {id: 'b'}]);
            }
                
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
            
            it("provides a domain and a range column", function () {
                // Should have two columns
                expect(controller.rows()[0].length).toEqual([]);
                
                // And they should have these headers 
                expect(controller.headers()).toEqual(["Time", "Message"]);
            });

            it("does not throw if telemetry controller is undefined", function () {
                // Just a general robustness check
                mockScope.telemetry = undefined;
                expect(mockScope.$watch.mostRecentCall.args[1])
                    .not.toThrow();
            });
        });
    }
);