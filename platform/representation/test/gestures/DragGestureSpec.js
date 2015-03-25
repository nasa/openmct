/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * DragGestureSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/gestures/DragGesture", "../../src/gestures/GestureConstants"],
    function (DragGesture, GestureConstants) {
        "use strict";

        var JQLITE_FUNCTIONS = [ "on", "off", "attr", "removeAttr" ],
            LOG_FUNCTIONS = [ "error", "warn", "info", "debug"],
            DND_FUNCTIONS = [ "setData", "getData", "removeData" ],
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability"],
            TEST_ID = "test-id";



        describe("The drag gesture", function () {
            var mockLog,
                mockDndService,
                mockElement,
                mockDomainObject,
                mockDataTransfer,
                handlers,
                gesture;

            beforeEach(function () {
                mockLog = jasmine.createSpyObj("$log", LOG_FUNCTIONS);
                mockDndService = jasmine.createSpyObj("dndService", DND_FUNCTIONS);
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockDataTransfer = jasmine.createSpyObj("dataTransfer", ["setData"]);

                mockDomainObject.getId.andReturn(TEST_ID);
                mockDomainObject.getModel.andReturn({});

                handlers = {};

                gesture = new DragGesture(mockLog, mockDndService, mockElement, mockDomainObject);

                // Look up all handlers registered by the gesture
                mockElement.on.calls.forEach(function (call) {
                    handlers[call.args[0]] = call.args[1];
                });
            });

            it("listens for dragstart on the element", function () {
                expect(handlers.dragstart).toEqual(jasmine.any(Function));
            });

            it("marks an element as draggable", function () {
                expect(mockElement.attr).toHaveBeenCalledWith("draggable", "true");
            });

            it("places data in a dataTransfer object", function () {
                handlers.dragstart({ dataTransfer: mockDataTransfer });
                expect(mockDataTransfer.setData).toHaveBeenCalledWith(
                    GestureConstants.MCT_DRAG_TYPE,
                    TEST_ID
                );
            });

            it("places domain object in the dnd service", function () {
                handlers.dragstart({ dataTransfer: mockDataTransfer });
                expect(mockDndService.setData).toHaveBeenCalledWith(
                    GestureConstants.MCT_DRAG_TYPE,
                    TEST_ID
                );
                expect(mockDndService.setData).toHaveBeenCalledWith(
                    GestureConstants.MCT_EXTENDED_DRAG_TYPE,
                    mockDomainObject
                );
            });

            it("clears domain object from the dnd service on drag end", function () {
                // Start dragging
                handlers.dragstart({ dataTransfer: mockDataTransfer });

                // Verify precondition
                expect(mockDndService.removeData).not.toHaveBeenCalled();

                // End the drag
                handlers.dragend({ dataTransfer: mockDataTransfer });

                // Should have removed the data that was attached
                expect(mockDndService.removeData)
                    .toHaveBeenCalledWith(GestureConstants.MCT_DRAG_TYPE);
                expect(mockDndService.removeData)
                    .toHaveBeenCalledWith(GestureConstants.MCT_EXTENDED_DRAG_TYPE);
            });

            it("logs a warning if dataTransfer cannot be set", function () {
                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Fire the gesture without a dataTransfer field
                handlers.dragstart({});

                // Should have logged a warning
                expect(mockLog.warn).toHaveBeenCalled();
            });

            it("removes draggable attribute and listener when destroyed", function () {
                // Verify preconditions
                expect(mockElement.removeAttr).not.toHaveBeenCalled();
                expect(mockElement.off).not.toHaveBeenCalled();

                // Notify the gesture that its scope is being destroyed
                gesture.destroy();

                // Verify that attribute/listener were removed
                expect(mockElement.removeAttr).toHaveBeenCalledWith("draggable");
                expect(mockElement.off).toHaveBeenCalledWith("dragstart", handlers.dragstart);
            });

        });
    }
);