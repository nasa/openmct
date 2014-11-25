/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/actions/EditAction"],
    function (EditAction) {
        "use strict";

        describe("The Edit action", function () {
            var mockLocation,
                mockNavigationService,
                mockLog,
                mockDomainObject,
                actionContext,
                action;

            beforeEach(function () {
                mockLocation = jasmine.createSpyObj(
                    "$location",
                    [ "path" ]
                );
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [ "setNavigation", "getNavigation" ]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    [ "error", "warn", "info", "debug" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );

                actionContext = { domainObject: mockDomainObject };

                action = new EditAction(
                    mockLocation,
                    mockNavigationService,
                    mockLog,
                    actionContext
                );
            });

            it("is only applicable when a domain object is present", function () {
                expect(EditAction.appliesTo(actionContext)).toBeTruthy();
                expect(EditAction.appliesTo({})).toBeFalsy();
            });

            it("changes URL path to edit mode when performed", function () {
                action.perform();
                expect(mockLocation.path).toHaveBeenCalledWith("/edit");
            });

            it("ensures that the edited object is navigated-to", function () {
                action.perform();
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("logs a warning if constructed when inapplicable", function () {
                // Verify precondition (ensure warn wasn't called during setup)
                expect(mockLog.warn).not.toHaveBeenCalled();

                // Should not have hit an exception...
                new EditAction(
                    mockLocation,
                    mockNavigationService,
                    mockLog,
                    {}
                ).perform();

                // ...but should have logged a warning
                expect(mockLog.warn).toHaveBeenCalled();

                // And should not have had other interactions
                expect(mockLocation.path)
                    .not.toHaveBeenCalled();
                expect(mockNavigationService.setNavigation)
                    .not.toHaveBeenCalled();
            });



        });
    }
);