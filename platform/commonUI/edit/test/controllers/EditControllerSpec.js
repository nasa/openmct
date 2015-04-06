/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/controllers/EditController"],
    function (EditController) {
        "use strict";

        describe("The Edit mode controller", function () {
            var mockScope,
                mockQ,
                mockNavigationService,
                mockObject,
                mockCapability,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on" ]
                );
                mockQ = jasmine.createSpyObj('$q', ['when', 'all']);
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [ "getNavigation", "addListener", "removeListener" ]
                );
                mockObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockCapability = jasmine.createSpyObj(
                    "capability",
                    [ "invoke" ]
                );

                mockNavigationService.getNavigation.andReturn(mockObject);
                mockObject.getId.andReturn("test");
                mockObject.getModel.andReturn({ name: "Test object" });
                mockObject.getCapability.andReturn(mockCapability);

                controller = new EditController(
                    mockScope,
                    mockQ,
                    mockNavigationService
                );
            });

            it("exposes the currently-navigated object", function () {
                expect(controller.navigatedObject()).toBeDefined();
                expect(controller.navigatedObject().getId()).toEqual("test");
            });

            it("adds an editor capability to the navigated object", function () {
                // Should provide an editor capability...
                expect(controller.navigatedObject().getCapability("editor"))
                    .toBeDefined();
                // Shouldn't have been the mock capability we provided
                expect(controller.navigatedObject().getCapability("editor"))
                    .not.toEqual(mockCapability);
            });

            it("detaches its navigation listener when destroyed", function () {
                var navCallback = mockNavigationService
                        .addListener.mostRecentCall.args[0];

                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );

                // Verify precondition
                expect(mockNavigationService.removeListener)
                    .not.toHaveBeenCalled();

                // Trigger destroy
                mockScope.$on.mostRecentCall.args[1]();

                // Listener should have been removed
                expect(mockNavigationService.removeListener)
                    .toHaveBeenCalledWith(navCallback);
            });

            it("exposes a warning message for unload", function () {
                var obj = controller.navigatedObject(),
                    mockEditor = jasmine.createSpyObj('editor', ['dirty']);

                // Normally, should be undefined
                expect(controller.getUnloadWarning()).toBeUndefined();

                // Override the object's editor capability, make it look
                // like there are unsaved changes.
                obj.getCapability = jasmine.createSpy();
                obj.getCapability.andReturn(mockEditor);
                mockEditor.dirty.andReturn(true);

                // Should have some warning message here now
                expect(controller.getUnloadWarning()).toEqual(jasmine.any(String));
            });

        });
    }
);