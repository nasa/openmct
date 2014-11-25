/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/actions/SaveAction"],
    function (SaveAction) {
        "use strict";

        describe("The Save action", function () {
            var mockLocation,
                mockDomainObject,
                mockEditorCapability,
                actionContext,
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockLocation = jasmine.createSpyObj(
                    "$location",
                    [ "path" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getCapability", "hasCapability" ]
                );
                mockEditorCapability = jasmine.createSpyObj(
                    "editor",
                    [ "save", "cancel" ]
                );


                actionContext = {
                    domainObject: mockDomainObject
                };

                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.getCapability.andReturn(mockEditorCapability);
                mockEditorCapability.save.andReturn(mockPromise(true));

                action = new SaveAction(mockLocation, actionContext);

            });

            it("only applies to domain object with an editor capability", function () {
                expect(SaveAction.appliesTo(actionContext)).toBeTruthy();
                expect(mockDomainObject.hasCapability).toHaveBeenCalledWith("editor");

                mockDomainObject.hasCapability.andReturn(false);
                mockDomainObject.getCapability.andReturn(undefined);
                expect(SaveAction.appliesTo(actionContext)).toBeFalsy();
            });

            it("invokes the editor capability's save functionality when performed", function () {
                // Verify precondition
                expect(mockEditorCapability.save).not.toHaveBeenCalled();
                action.perform();

                // Should have called cancel
                expect(mockEditorCapability.save).toHaveBeenCalled();

                // Also shouldn't call cancel
                expect(mockEditorCapability.cancel).not.toHaveBeenCalled();
            });

            it("returns to browse when performed", function () {
                action.perform();
                expect(mockLocation.path).toHaveBeenCalledWith("/browse");
            });
        });
    }
);