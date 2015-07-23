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
    ["../../src/gestures/ContextMenuGesture", "../../src/gestures/GestureConstants"],
    function (ContextMenuGesture, GestureConstants) {
        "use strict";

        var JQLITE_FUNCTIONS = [ "on", "off", "find", "append", "remove" ],
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability" ],
            MENU_DIMENSIONS = GestureConstants.MCT_MENU_DIMENSIONS;


        describe("The 'context menu' gesture", function () {
            var mockCompile,
                mockCompiledTemplate,
                mockMenu,
                mockDocument,
                mockBody,
                mockWindow,
                mockRootScope,
                mockQueryService,
                mockScope,
                mockElement,
                mockDomainObject,
                mockEvent,
                gesture,
                fireGesture;

            beforeEach(function () {
                mockCompile = jasmine.createSpy("$compile");
                mockCompiledTemplate = jasmine.createSpy("template");
                mockMenu = jasmine.createSpyObj("menu", JQLITE_FUNCTIONS);
                mockDocument = jasmine.createSpyObj("$document", JQLITE_FUNCTIONS);
                mockBody = jasmine.createSpyObj("body", JQLITE_FUNCTIONS);
                mockWindow = { innerWidth: MENU_DIMENSIONS[0] * 4, innerHeight: MENU_DIMENSIONS[1] * 4 };
                mockRootScope = jasmine.createSpyObj("$rootScope", ["$new"]);
                mockScope = {};
                mockQueryService = jasmine.createSpyObj("queryService", ["isMobile"]);
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockEvent = jasmine.createSpyObj("event", ["preventDefault"]);
                mockEvent.pageX = 0;
                mockEvent.pageY = 0;
                
                
                mockCompile.andReturn(mockCompiledTemplate);
                mockCompiledTemplate.andReturn(mockMenu);
                mockDocument.find.andReturn(mockBody);
                mockRootScope.$new.andReturn(mockScope);

                gesture = new ContextMenuGesture(
                    mockCompile,
                    mockDocument,
                    mockWindow,
                    mockRootScope,
                    mockQueryService,
                    mockElement,
                    mockDomainObject
                );

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
                    mockElement.on.mostRecentCall.args[1]
                );
            });

            it("compiles and adds a menu to the DOM on a contextmenu event", function () {
                // Make sure that callback really is for the contextmenu event
                expect(mockElement.on.mostRecentCall.args[0]).toEqual("contextmenu");

                fireGesture(mockEvent);

                expect(mockBody.append).toHaveBeenCalledWith(mockMenu);
            });

            it("prevents the default context menu behavior", function () {
                fireGesture(mockEvent);
                expect(mockEvent.preventDefault).toHaveBeenCalled();
            });

            it("positions menus where clicked", function () {
                mockEvent.pageX = 10;
                mockEvent.pageY = 5;
                fireGesture(mockEvent);
                expect(mockScope.menuStyle.left).toEqual("10px");
                expect(mockScope.menuStyle.top).toEqual("5px");
                expect(mockScope.menuStyle.right).toBeUndefined();
                expect(mockScope.menuStyle.bottom).toBeUndefined();
                expect(mockScope.menuClass['go-up']).toBeFalsy();
                expect(mockScope.menuClass['go-left']).toBeFalsy();
            });

            it("repositions menus near the screen edge", function () {
                mockEvent.pageX = mockWindow.innerWidth - 10;
                mockEvent.pageY = mockWindow.innerHeight - 5;
                fireGesture(mockEvent);
                expect(mockScope.menuStyle.right).toEqual("10px");
                expect(mockScope.menuStyle.bottom).toEqual("5px");
                expect(mockScope.menuStyle.left).toBeUndefined();
                expect(mockScope.menuStyle.top).toBeUndefined();
                expect(mockScope.menuClass['go-up']).toBeTruthy();
                expect(mockScope.menuClass['go-left']).toBeTruthy();
            });

            it("removes a menu when body is clicked", function () {
                // Show the menu
                fireGesture(mockEvent);

                // Verify precondition
                expect(mockBody.off).not.toHaveBeenCalled();

                // Find and fire body's click listener
                mockBody.on.calls.forEach(function (call) {
                    if (call.args[0] === 'click') {
                        call.args[1]();
                    }
                });

                // Menu should have been removed
                expect(mockMenu.remove).toHaveBeenCalled();

                // Listener should have been detached from body
                expect(mockBody.off).toHaveBeenCalled();
            });

            it("removes listeners from body if destroyed while menu is showing", function () {
                // Show the menu
                fireGesture(mockEvent);

                // Verify preconditions
                expect(mockBody.off).not.toHaveBeenCalled();
                expect(mockMenu.remove).not.toHaveBeenCalled();

                // Destroy the menu
                gesture.destroy();

                // Verify menu was removed and listener detached
                expect(mockBody.off).toHaveBeenCalled();
                expect(mockMenu.remove).toHaveBeenCalled();
            });

        });
    }
);