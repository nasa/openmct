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


/**
 * Module defining ContextMenuGestureSpec. Created by vwoeltje on 11/22/14.
 */
define(
    ["../../src/gestures/ContextMenuGesture"],
    function (ContextMenuGesture) {
        "use strict";

        var JQLITE_FUNCTIONS = [ "on", "off", "find", "append", "remove" ],
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability" ];


        describe("The 'context menu' gesture", function () {
            var mockTimeout,
                mockElement,
                mockQueryService,
                mockDomainObject,
                mockEvent,
                gesture,
                fireGesture;

            beforeEach(function () {
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockTimeout = jasmine.createSpy("$timeout");
                mockQueryService = jasmine.createSpyObj("queryService", ["isMobile"]);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockEvent = jasmine.createSpyObj("event", ["preventDefault"]);
                
                gesture = new ContextMenuGesture(mockTimeout, mockQueryService, mockElement, mockDomainObject);

                // Capture the contextmenu callback
                fireGesture =  mockElement.on.mostRecentCall.args[1];
            });

            it("attaches a callback for context menu events", function () {
                expect(mockElement.on).toHaveBeenCalledWith(
                    "contextmenu",
                    jasmine.any(Function)
                );
            });

            it("detaches a callback for context menu events when destroyed", function () {
                expect(mockElement.off).not.toHaveBeenCalled();

                gesture.destroy();

                expect(mockElement.off).toHaveBeenCalledWith(
                    "contextmenu",
                    //mockElement.on.mostRecentCall.args[1]
                    mockDomainObject.calls
                );
            });
            
            it("mobile", function () {
                mockQueryService.isMobile.andReturn(true);
                gesture = new ContextMenuGesture(mockTimeout, mockQueryService, mockElement, mockDomainObject);
                
                // Capture the contextmenu callback
                fireGesture =  mockElement.on.mostRecentCall.args[1];
                
                expect(mockElement.on).toHaveBeenCalledWith(
                    "touchstart",
                    jasmine.any(Function)
                );
            });
        });
    }
);