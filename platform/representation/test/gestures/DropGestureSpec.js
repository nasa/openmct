/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * DropGestureSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/gestures/DropGesture"],
    function (DropGesture) {
        "use strict";


        // Methods to mock
        var JQLITE_FUNCTIONS = [ "on", "off", "attr", "removeAttr", "scope" ],
            DOMAIN_OBJECT_METHODS = [ "getId", "getModel", "getCapability", "hasCapability", "useCapability"],
            TEST_ID = "test-id",
            DROP_ID = "drop-id";

        describe("The drop gesture", function () {
            var mockDndService,
                mockQ,
                mockElement,
                mockDomainObject,
                mockPersistence,
                mockAction,
                mockEvent,
                mockScope,
                mockUnwrappedElement,
                mockDraggedObject,
                mockCompose,
                testModel,
                testRect,
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
                testRect = {};

                mockDndService = jasmine.createSpyObj('dndService', ['getData']);
                mockQ = { when: mockPromise };
                mockElement = jasmine.createSpyObj("element", JQLITE_FUNCTIONS);
                mockDomainObject = jasmine.createSpyObj("domainObject", DOMAIN_OBJECT_METHODS);
                mockDraggedObject = jasmine.createSpyObj("draggedObject", DOMAIN_OBJECT_METHODS);
                mockPersistence = jasmine.createSpyObj("persistence", [ "persist" ]);
                mockEvent = jasmine.createSpyObj("event", ["preventDefault"]);
                mockEvent.dataTransfer = jasmine.createSpyObj("dataTransfer", [ "getData" ]);
                mockScope = jasmine.createSpyObj("$scope", ["$broadcast"]);
                mockUnwrappedElement = jasmine.createSpyObj("unwrapped", ["getBoundingClientRect"]);
                mockAction = jasmine.createSpyObj('action', ['getActions']);
                mockCompose = jasmine.createSpyObj('compose', ['perform']);

                mockDomainObject.getId.andReturn(TEST_ID);
                mockDomainObject.getModel.andReturn(testModel);
                mockDomainObject.getCapability.andCallFake(function (c) {
                    return {
                        persistence: mockPersistence,
                        action: mockAction
                    }[c];
                });
                mockDomainObject.useCapability.andReturn(true);
                mockEvent.dataTransfer.getData.andReturn(DROP_ID);
                mockElement[0] = mockUnwrappedElement;
                mockElement.scope.andReturn(mockScope);
                mockUnwrappedElement.getBoundingClientRect.andReturn(testRect);
                mockDndService.getData.andReturn(mockDraggedObject);
                mockAction.getActions.andReturn([mockCompose]);

                gesture = new DropGesture(
                    mockDndService,
                    mockQ,
                    mockElement,
                    mockDomainObject
                );

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

            it("invokes compose on drop", function () {
                callbacks.dragover(mockEvent);
                expect(mockAction.getActions).toHaveBeenCalledWith({
                    key: 'compose',
                    selectedObject: mockDraggedObject
                });
                callbacks.drop(mockEvent);
                expect(mockCompose.perform).toHaveBeenCalled();
            });


            it("broadcasts drop position", function () {
                testRect.left = 42;
                testRect.top = 36;
                mockEvent.pageX = 52;
                mockEvent.pageY = 64;
                callbacks.drop(mockEvent);
                expect(mockScope.$broadcast).toHaveBeenCalledWith(
                    'mctDrop',
                    DROP_ID,
                    { x: 10, y: 28 }
                );
            });

        });
    }
);