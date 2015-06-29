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
            var mockDomainObject,
                mockScope,
                mockTelemetryHandler,
                mockHandle,
                mockTelemetryFormatter,
                controller;
            
            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
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
                    ["getDomainValue", "getRangeValue", "getTelemetryObjects", "unsubscribe"]
                );
                mockTelemetryFormatter = jasmine.createSpyObj(
                    "formatter",
                    ["formatDomainValue", "formatRangeValue"]
                );
                
                controller = new RTEventListController(mockScope, mockTelemetryHandler, mockTelemetryFormatter);
                
                mockHandle.getDomainValue.andReturn("domain value");
                mockHandle.getRangeValue.andReturn("range value");
                
                mockTelemetryHandler.handle.andReturn(mockHandle);
                mockHandle.getTelemetryObjects.andReturn([mockDomainObject]);
                
                // Subscribe to the RT telemetry
                // second argument of: $scope.$watch("domainObject", makeSubscription);
                mockScope.$watch.calls.forEach(function (c) {
                    // There are two possible calls of $watch, so we need to filter 
                    // through the calls to get the correct kind 
                    if (c.args[0] === 'domainObject') {
                        c.args[1]();
                    }
                });
                
                // callback, passed into telemetry handler
                mockTelemetryHandler.handle.mostRecentCall.args[1]();
                
                // Update the telemetry objects
                // second argument of: $scope.$watch(getTelemetryObjects, updateObjects);
                mockScope.$watch.calls.forEach(function (c) {
                    // There are two possible calls of $watch, so we need to filter 
                    // through the calls to get the correct kind 
                    if (c.args[0] !== 'domainObject') {
                        c.args[1]([mockDomainObject]);
                    }
                });
                
            });
            
            it("provides a domain and a range column", function () {
                // Should have two columns with these headers 
                expect(controller.headers()).toEqual(["Time", "Message"]);
            });

            it("listens for telemetry data updates", function () {
                // Of the two possible $watch calls, this corresponds to 
                // $scope.$watch(getTelemetryObjects, updateObjects);
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    jasmine.any(Function)
                );
            });
            
            it("makes telemetry subscriptions", function () {
                // Of the two possible $watch calls, this corresponds to 
                // $scope.$watch("domainObject", makeSubscription);
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject",
                    jasmine.any(Function)
                );
            });
            
            it("releases telemetry subscriptions on destruction", function () {
                // Call the second argument of
                // $scope.$on("$destroy", releaseSubscription);
                mockScope.$on.mostRecentCall.args[1]();
                
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );
            });
        });
    }
);