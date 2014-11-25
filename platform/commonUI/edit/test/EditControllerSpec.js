/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../src/EditController"],
    function (EditController) {
        "use strict";

        describe("The Edit mode controller", function () {
            var mockScope,
                mockNavigationService,
                mockObject,
                mockCapability,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on" ]
                );
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
                    mockNavigationService
                );
            });

            it("places the currently-navigated object in scope", function () {
                expect(mockScope.navigatedObject).toBeDefined();
                expect(mockScope.navigatedObject.getId()).toEqual("test");
            });

            it("adds an editor capability to the navigated object", function () {
                // Should provide an editor capability...
                expect(mockScope.navigatedObject.getCapability("editor"))
                    .toBeDefined();
                // Shouldn't have been the mock capability we provided
                expect(mockScope.navigatedObject.getCapability("editor"))
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

        });
    }
);