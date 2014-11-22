/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * DropGestureSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/gestures/DropGesture"],
    function (DropGesture) {
        "use strict";


        // Methods to mock
        var JQLITE_FUNCTIONS = [ "on", "off", "attr", "removeAttr" ],
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability"],
            TEST_ID = "test-id",
            DROP_ID = "drop-id";

        describe("The drop gesture", function () {
            var mockQ,
                mockElement,
                mockDomainObject,
                mockPersistence,
                mockEvent,
                testModel,
                gesture,
                callbacks;

            function mockPromise(value) {
                return (value && value.then) ? value : {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                testModel = { composition: [] };

                mockQ = { when: mockPromise };
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockPersistence = jasmine.createSpyObj("persistence", [ "persist" ]);
                mockEvent = jasmine.createSpyObj("event", ["preventDefault"]);
                mockEvent.dataTransfer = jasmine.createSpyObj("dataTransfer", [ "getData" ]);

                mockDomainObject.getId.andReturn(TEST_ID);
                mockDomainObject.getModel.andReturn(testModel);
                mockDomainObject.getCapability.andReturn(mockPersistence);
                mockEvent.dataTransfer.getData.andReturn(DROP_ID);

                gesture = new DropGesture(mockQ, mockElement, mockDomainObject);

                // Get a reference to all callbacks registered during constructor
                callbacks = {};
                mockElement.on.calls.forEach(function (call) {
                    callbacks[call.args[0]] = call.args[1];
                });
            });

            it("attaches dragover and drop listeners", function () {
                expect(callbacks.dragover).toBeDefined();
                expect(callbacks.drop).toBeDefined();
            });

            it("removes all listeners when destroyed", function () {
                // Verify precondition
                expect(mockElement.off).not.toHaveBeenCalled();

                // Destroy
                gesture.destroy();

                // Verify all callbacks were unregistered
                Object.keys(callbacks).forEach(function (k) {
                    expect(mockElement.off).toHaveBeenCalledWith(k, callbacks[k]);
                });
            });

            it("accepts data transfer and prevents default behavior on dragover", function () {
                expect(callbacks.dragover(mockEvent)).toEqual(false);
                expect(mockEvent.preventDefault).toHaveBeenCalled();
                expect(mockEvent.dataTransfer.dropEffect).toBeDefined();
            });

            it("mutates composition on drop", function () {
                callbacks.drop(mockEvent);
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith("mutation", jasmine.any(Function));

                // Call the mutation function, as the mutation capability would
                testModel = mockDomainObject.useCapability.mostRecentCall.args[1](testModel) || testModel;

                // Should have the test id
                expect(testModel.composition).toEqual([DROP_ID]);
            });

            it("does not permit redundant IDs in composition", function () {
                testModel.composition = [DROP_ID];

                callbacks.drop(mockEvent);
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith("mutation", jasmine.any(Function));

                // Call the mutation function, as the mutation capability would
                testModel = mockDomainObject.useCapability.mostRecentCall.args[1](testModel) || testModel;

                // Should still just have the one instance of DROP_ID
                expect(testModel.composition).toEqual([DROP_ID]);
            });


            it("persists when mutation is successful", function () {
                mockDomainObject.getCapability.andReturn(mockPersistence);
                mockDomainObject.useCapability.andReturn(true);
                callbacks.drop(mockEvent);
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith("mutation", jasmine.any(Function));
                expect(mockDomainObject.getCapability).toHaveBeenCalledWith("persistence");
            });

        });
    }
);