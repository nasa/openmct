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
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability"],
            TEST_ID = "test-id";



        describe("The drag gesture", function () {
            var mockLog,
                mockElement,
                mockDomainObject,
                mockDataTransfer,
                gesture,
                fireGesture;

            beforeEach(function () {
                mockLog = jasmine.createSpyObj("$log", LOG_FUNCTIONS);
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockDataTransfer = jasmine.createSpyObj("dataTransfer", ["setData"]);

                mockDomainObject.getId.andReturn(TEST_ID);
                mockDomainObject.getModel.andReturn({});

                gesture = new DragGesture(mockLog, mockElement, mockDomainObject);
                fireGesture = mockElement.on.mostRecentCall.args[1];
            });

            it("listens for dragstart on the element", function () {
                expect(mockElement.on.mostRecentCall.args[0]).toEqual("dragstart");
            });

            it("marks an element as draggable", function () {
                expect(mockElement.attr).toHaveBeenCalledWith("draggable", "true");
            });

            it("places data in a dataTransfer object", function () {
                fireGesture({ dataTransfer: mockDataTransfer });
                expect(mockDataTransfer.setData).toHaveBeenCalledWith(
                    GestureConstants.MCT_DRAG_TYPE,
                    TEST_ID
                );
            });

            it("logs a warning if dataTransfer cannot be set", function () {
                // Verify precondition
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Fire the gesture without a dataTransfer field
                fireGesture({});

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
                expect(mockElement.off).toHaveBeenCalledWith("dragstart", fireGesture);
            });

        });
    }
);