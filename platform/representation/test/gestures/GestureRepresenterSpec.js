/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/gestures/GestureRepresenter"],
    function (GestureRepresenter) {
        "use strict";

        describe("A gesture representer", function () {
            var mockGestureService,
                mockGestureHandle,
                mockScope,
                mockElement,
                representer;

            beforeEach(function () {
                mockGestureService = jasmine.createSpyObj(
                    "gestureService",
                    [ "attachGestures" ]
                );
                mockGestureHandle = jasmine.createSpyObj(
                    "gestureHandle",
                    [ "destroy" ]
                );

                mockElement = { someKey: "some value" };

                mockGestureService.attachGestures.andReturn(mockGestureHandle);

                representer = new GestureRepresenter(
                    mockGestureService,
                    undefined, // Scope is not used
                    mockElement
                );
            });

            it("attaches declared gestures, and detaches on request", function () {
                // Pass in some objects, which we expect to be passed into the
                // gesture service accordingly.
                var domainObject = { someOtherKey: "some other value" },
                    representation = { gestures: ["a", "b", "c"] };

                representer.represent(representation, domainObject);

                expect(mockGestureService.attachGestures).toHaveBeenCalledWith(
                    mockElement,
                    domainObject,
                    [ "a", "b", "c" ]
                );

                // Should not have been destroyed yet...
                expect(mockGestureHandle.destroy).not.toHaveBeenCalled();

                // Destroy
                representer.destroy();

                // Should have destroyed those old gestures
                expect(mockGestureHandle.destroy).toHaveBeenCalled();
            });

        });
    }
);