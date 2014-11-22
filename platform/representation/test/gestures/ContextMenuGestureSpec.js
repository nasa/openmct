/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


/**
 * Module defining ContextMenuGestureSpec. Created by vwoeltje on 11/22/14.
 */
define(
    ["../../src/gestures/ContextMenuGesture", "../../src/gestures/GestureConstants"],
    function (ContextMenuGesture, GestureConstants) {
        "use strict";

        var JQLITE_FUNCTIONS = [ "on", "off", "find", "append", "remove" ],
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability" ];


        describe("The 'context menu' gesture", function () {
            var mockCompile,
                mockCompiledTemplate,
                mockMenu,
                mockDocument,
                mockBody,
                mockWindow,
                mockRootScope,
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
                mockWindow = { innerWidth: GestureConstants[0] * 4, innerHeight: GestureConstants[1] * 4 };
                mockRootScope = jasmine.createSpyObj("$rootScope", ["$new"]);
                mockScope = {};
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