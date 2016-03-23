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
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability"];


        describe("The 'context menu' gesture", function () {
            var mockTimeout,
                mockElement,
                mockAgentService,
                mockDomainObject,
                mockEvent,
                mockTouchEvent,
                mockContextMenuAction,
                mockActionContext,
                mockTouch,
                gesture,
                fireGesture,
                fireTouchStartGesture,
                fireTouchEndGesture;

            beforeEach(function () {
                mockTimeout = jasmine.createSpy("$timeout");
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockAgentService = jasmine.createSpyObj("agentService", ["isMobile"]);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockEvent = jasmine.createSpyObj("event", ["preventDefault"]);
                mockContextMenuAction = jasmine.createSpyObj(
                    "action",
                    [ "perform", "getActions" ]
                );
                
                mockActionContext = {domainObject: mockDomainObject, event: mockEvent};
                mockDomainObject.getCapability.andReturn(mockContextMenuAction);
                mockContextMenuAction.perform.andReturn(jasmine.any(Function));
                mockAgentService.isMobile.andReturn(false);
                
                
                gesture = new ContextMenuGesture(mockTimeout, mockAgentService, mockElement, mockDomainObject);

                // Capture the contextmenu callback
                fireGesture =  mockElement.on.mostRecentCall.args[1];
            });

            it("attaches a callback for context menu events", function () {
                // Fire a click and expect it to happen
                fireGesture();
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
            
            it("attaches a callback for context menu events on mobile", function () {
                // Mock touch event and set to mobile device
                mockTouchEvent = jasmine.createSpyObj("event", ["preventDefault", "touches"]);
                mockTouch = jasmine.createSpyObj("touch", ["length"]);
                mockTouch.length = 1;
                mockTouchEvent.touches.andReturn(mockTouch);
                mockAgentService.isMobile.andReturn(true);
                
                // Then create new (mobile) gesture
                gesture = new ContextMenuGesture(mockTimeout, mockAgentService, mockElement, mockDomainObject);
                
                // Set calls for the touchstart and touchend gestures
                fireTouchStartGesture = mockElement.on.calls[1].args[1];
                fireTouchEndGesture =  mockElement.on.mostRecentCall.args[1];
                
                // Fire touchstart and expect touch start to begin
                fireTouchStartGesture(mockTouchEvent);
                expect(mockElement.on).toHaveBeenCalledWith(
                    "touchstart",
                    jasmine.any(Function)
                );
                
                // Expect timeout to begin and then fireTouchEnd
                expect(mockTimeout).toHaveBeenCalled();
                mockTimeout.mostRecentCall.args[0]();
                fireTouchEndGesture(mockTouchEvent);
            });
        });
    }
);