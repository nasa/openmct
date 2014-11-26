/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/navigation/NavigateAction"],
    function (NavigateAction) {
        "use strict";

        describe("The navigate action", function () {
            var mockNavigationService,
                mockQ,
                actionContext,
                mockDomainObject,
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [ "setNavigation" ]
                );
                mockQ = { when: mockPromise };
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );

                action = new NavigateAction(
                    mockNavigationService,
                    mockQ,
                    { domainObject: mockDomainObject }
                );
            });

            it("invokes the navigate service when performed", function () {
                action.perform();
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("is only applicable when a domain object is in context", function () {
                expect(NavigateAction.appliesTo({})).toBeFalsy();
                expect(NavigateAction.appliesTo({
                    domainObject: mockDomainObject
                })).toBeTruthy();
            });

        });
    }
);