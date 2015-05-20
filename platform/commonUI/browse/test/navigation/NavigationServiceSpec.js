/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/navigation/NavigationService"],
    function (NavigationService) {
        "use strict";

        describe("The navigation service", function () {
            var navigationService;

            beforeEach(function () {
                navigationService = new NavigationService();
            });

            it("stores navigation state", function () {
                var testObject = { someKey: 42 },
                    otherObject = { someKey: "some value" };
                expect(navigationService.getNavigation())
                    .toBeUndefined();
                navigationService.setNavigation(testObject);
                expect(navigationService.getNavigation())
                    .toBe(testObject);
                expect(navigationService.getNavigation())
                    .toBe(testObject);
                navigationService.setNavigation(otherObject);
                expect(navigationService.getNavigation())
                    .toBe(otherObject);
            });

            it("notifies listeners on change", function () {
                var testObject = { someKey: 42 },
                    callback = jasmine.createSpy("callback");

                navigationService.addListener(callback);
                expect(callback).not.toHaveBeenCalled();

                navigationService.setNavigation(testObject);
                expect(callback).toHaveBeenCalledWith(testObject);
            });

            it("does not notify listeners when no changes occur", function () {
                var testObject = { someKey: 42 },
                    callback = jasmine.createSpy("callback");

                navigationService.addListener(callback);
                navigationService.setNavigation(testObject);
                navigationService.setNavigation(testObject);
                expect(callback.calls.length).toEqual(1);
            });

            it("stops notifying listeners after removal", function () {
                var testObject = { someKey: 42 },
                    callback = jasmine.createSpy("callback");

                navigationService.addListener(callback);
                navigationService.removeListener(callback);


                navigationService.setNavigation(testObject);
                expect(callback).not.toHaveBeenCalled();
            });

        });
    }
);