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
/*global define,describe,it,expect,beforeEach,jasmine*/


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
                mockPopupService,
                mockRootScope,
                mockAgentService,
                mockScope,
                mockElement,
                mockDomainObject,
                mockEvent,
                mockPopup,
                mockActionContext,
                action;

            beforeEach(function () {
                mockCompile = jasmine.createSpy("$compile");
                mockCompiledTemplate = jasmine.createSpy("template");
                mockMenu = jasmine.createSpyObj("menu", JQLITE_FUNCTIONS);
                mockDocument = jasmine.createSpyObj("$document", JQLITE_FUNCTIONS);
                mockBody = jasmine.createSpyObj("body", JQLITE_FUNCTIONS);
                mockPopupService =
                    jasmine.createSpyObj("popupService", ["display"]);
                mockPopup = jasmine.createSpyObj("popup", [
                    "dismiss",
                    "goesLeft",
                    "goesUp"
                ]);
                mockRootScope = jasmine.createSpyObj("$rootScope", ["$new"]);
                mockAgentService = jasmine.createSpyObj("agentService", ["isMobile"]);
                mockScope = jasmine.createSpyObj("scope", ["$destroy"]);
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockEvent = jasmine.createSpyObj("event", ["preventDefault", "stopPropagation"]);
                mockEvent.pageX = 123;
                mockEvent.pageY = 321;

                mockCompile.andReturn(mockCompiledTemplate);
                mockCompiledTemplate.andReturn(mockMenu);
                mockDocument.find.andReturn(mockBody);
                mockRootScope.$new.andReturn(mockScope);
                mockPopupService.display.andReturn(mockPopup);

                mockActionContext = {key: 'menu', domainObject: mockDomainObject, event: mockEvent};

                action = new ContextMenuAction(
                    mockCompile,
                    mockDocument,
                    mockRootScope,
                    mockPopupService,
                    mockAgentService,
                    mockActionContext
                );
            });

            it("displays a popup when performed", function () {
                action.perform();
                expect(mockPopupService.display).toHaveBeenCalledWith(
                    mockMenu,
                    [ mockEvent.pageX, mockEvent.pageY ],
                    jasmine.any(Object)
                );
            });

            it("prevents the default context menu behavior", function () {
                action.perform();
                expect(mockEvent.preventDefault).toHaveBeenCalled();
            });

            it("adds classes to menus based on position", function () {
                var booleans = [ false, true ];

                booleans.forEach(function (goLeft) {
                    booleans.forEach(function (goUp) {
                        mockPopup.goesLeft.andReturn(goLeft);
                        mockPopup.goesUp.andReturn(goUp);
                        action.perform();
                        expect(!!mockScope.menuClass['go-up'])
                            .toEqual(goUp);
                        expect(!!mockScope.menuClass['go-left'])
                            .toEqual(goLeft);
                    });
                });
            });


            it("removes a menu when body is clicked", function () {
                // Show the menu
                action.perform();

                // Verify precondition
                expect(mockBody.remove).not.toHaveBeenCalled();

                // Find and fire body's mousedown listener
                mockBody.on.calls.forEach(function (call) {
                    if (call.args[0] === 'mousedown') {
                        call.args[1]();
                    }
                });

                // Menu should have been removed
                expect(mockPopup.dismiss).toHaveBeenCalled();

                // Listener should have been detached from body
                expect(mockBody.off).toHaveBeenCalledWith(
                    'mousedown',
                    jasmine.any(Function)
                );
            });

            it("removes a menu when it is clicked", function () {
                // Show the menu
                action.perform();

                // Verify precondition
                expect(mockMenu.remove).not.toHaveBeenCalled();

                // Find and fire menu's click listener
                mockMenu.on.calls.forEach(function (call) {
                    if (call.args[0] === 'click') {
                        call.args[1]();
                    }
                });

                // Menu should have been removed
                expect(mockPopup.dismiss).toHaveBeenCalled();
            });

            it("keeps a menu when menu is clicked", function () {
                // Show the menu
                action.perform();
                // Find and fire body's mousedown listener
                mockMenu.on.calls.forEach(function (call) {
                    if (call.args[0] === 'mousedown') {
                        call.args[1](mockEvent);
                    }
                });

                // Menu should have been removed
                expect(mockPopup.dismiss).not.toHaveBeenCalled();

                // Listener should have been detached from body
                expect(mockBody.off).not.toHaveBeenCalled();
            });

            it("keeps a menu when menu is clicked on mobile", function () {
                mockAgentService.isMobile.andReturn(true);
                action = new ContextMenuAction(
                    mockCompile,
                    mockDocument,
                    mockRootScope,
                    mockPopupService,
                    mockAgentService,
                    mockActionContext
                );
                action.perform();

                mockMenu.on.calls.forEach(function (call) {
                    if (call.args[0] === 'touchstart') {
                        call.args[1](mockEvent);
                    }
                });

                expect(mockPopup.dismiss).not.toHaveBeenCalled();
            });
        });
    }
);
