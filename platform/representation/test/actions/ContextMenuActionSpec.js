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
 * Module defining ContextMenuActionSpec. Created by shale on 07/02/2015.
 */
define(
    ["../../src/actions/ContextMenuAction", "../../src/gestures/GestureConstants"],
    function (ContextMenuAction, GestureConstants) {
        "use strict";

        var JQLITE_FUNCTIONS = [ "on", "off", "find", "append", "remove" ],
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability" ],
            MENU_DIMENSIONS = GestureConstants.MCT_MENU_DIMENSIONS;


        describe("The 'context menu' action", function () {
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
                mockActionContext,
                mockNavigator,
                mockStopPropagation,
                action;

            beforeEach(function () {
                mockCompile = jasmine.createSpy("$compile");
                mockCompiledTemplate = jasmine.createSpy("template");
                mockMenu = jasmine.createSpyObj("menu", JQLITE_FUNCTIONS);
                mockDocument = jasmine.createSpyObj("$document", JQLITE_FUNCTIONS);
                mockBody = jasmine.createSpyObj("body", JQLITE_FUNCTIONS);
                mockWindow = { innerWidth: MENU_DIMENSIONS[0] * 4, innerHeight: MENU_DIMENSIONS[1] * 4 };
                mockRootScope = jasmine.createSpyObj("$rootScope", ["$new"]);
                mockQueryService = jasmine.createSpyObj("queryService", ["isMobile"]);
                mockScope = {};
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockEvent = jasmine.createSpyObj("event", ["preventDefault", "stopPropagation"]);
                mockEvent.pageX = 0;
                mockEvent.pageY = 0;

                mockCompile.andReturn(mockCompiledTemplate);
                mockCompiledTemplate.andReturn(mockMenu);
                mockDocument.find.andReturn(mockBody);
                mockRootScope.$new.andReturn(mockScope);
                
                mockActionContext = {key: 'menu', domainObject: mockDomainObject, event: mockEvent};
                
                action = new ContextMenuAction(
                    mockCompile,
                    mockDocument,
                    mockWindow,
                    mockRootScope,
                    mockQueryService,
                    mockActionContext
                );
            });

            it(" adds a menu to the DOM when perform is called", function () {
                action.perform();
                expect(mockBody.append).toHaveBeenCalledWith(mockMenu);
            });

            it("prevents the default context menu behavior", function () {
                action.perform();
                expect(mockEvent.preventDefault).toHaveBeenCalled();
            });

            it("positions menus where clicked", function () {
                mockEvent.pageX = 10;
                mockEvent.pageY = 5;
                action.perform();
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
                action.perform();
                expect(mockScope.menuStyle.right).toEqual("10px");
                expect(mockScope.menuStyle.bottom).toEqual("5px");
                expect(mockScope.menuStyle.left).toBeUndefined();
                expect(mockScope.menuStyle.top).toBeUndefined();
                expect(mockScope.menuClass['go-up']).toBeTruthy();
                expect(mockScope.menuClass['go-left']).toBeTruthy();
            });

            it("removes a menu when body is clicked", function () {
                // Show the menu
                action.perform();
                
                // Verify precondition
                expect(mockBody.off).not.toHaveBeenCalled();

                // Find and fire body's mousedown listener
                mockBody.on.calls.forEach(function (call) {
                    if (call.args[0] === 'mousedown') {
                        call.args[1]();
                    }
                });

                // Menu should have been removed
                expect(mockMenu.remove).toHaveBeenCalled();

                // Listener should have been detached from body
                expect(mockBody.off).toHaveBeenCalled();
            });
            
            it("keeps a menu when menu is clicked", function () {
                // Show the menu
                mockEvent
                action.perform();
                
                // Find and fire body's mousedown listener
                mockMenu.on.calls.forEach(function (call) {
                    if (call.args[0] === 'mousedown') {
//                        call.args[1]();
                    }
                });

                // Menu should have been removed
                expect(mockMenu.remove).not.toHaveBeenCalled();

                // Listener should have been detached from body
                expect(mockBody.off).not.toHaveBeenCalled();
            });
            
            it("mobile", function () {
                mockQueryService.isMobile.andReturn(true);
                action = new ContextMenuAction(
                    mockCompile,
                    mockDocument,
                    mockWindow,
                    mockRootScope,
                    mockQueryService,
                    mockActionContext
                );
                action.perform();
                
                mockMenu.on.calls.forEach(function (call) {
                    if (call.args[0] === 'touchstart') {
//                        call.args[1]();
                    }
                });
            });
        });
    }
);