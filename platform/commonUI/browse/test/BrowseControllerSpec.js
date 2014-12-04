/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/BrowseController"],
    function (BrowseController) {
        "use strict";

        describe("The browse controller", function () {
            var mockScope,
                mockObjectService,
                mockNavigationService,
                mockRootObject,
                mockDomainObject,
                controller;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$on", "$watch" ]
                );
                mockObjectService = jasmine.createSpyObj(
                    "objectService",
                    [ "getObjects" ]
                );
                mockNavigationService = jasmine.createSpyObj(
                    "navigationService",
                    [
                        "getNavigation",
                        "setNavigation",
                        "addListener",
                        "removeListener"
                    ]
                );
                mockRootObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "getModel", "useCapability" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getCapability", "getModel", "useCapability" ]
                );

                mockObjectService.getObjects.andReturn(mockPromise({
                    ROOT: mockRootObject
                }));


                controller = new BrowseController(
                    mockScope,
                    mockObjectService,
                    mockNavigationService
                );
            });

            it("uses composition to set the navigated object, if there is none", function () {
                mockRootObject.useCapability.andReturn(mockPromise([
                    mockDomainObject
                ]));
                controller = new BrowseController(
                    mockScope,
                    mockObjectService,
                    mockNavigationService
                );
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject);
            });

            it("does not try to override navigation", function () {
                // This behavior is needed if object navigation has been
                // determined by query string parameters
                mockRootObject.useCapability.andReturn(mockPromise([null]));
                mockNavigationService.getNavigation.andReturn(mockDomainObject);
                controller = new BrowseController(
                    mockScope,
                    mockObjectService,
                    mockNavigationService
                );
                expect(mockScope.navigatedObject).toBe(mockDomainObject);
            });

            it("updates scope when navigated object changes", function () {
                // Should have registered a listener - call it
                mockNavigationService.addListener.mostRecentCall.args[0](
                    mockDomainObject
                );
                expect(mockScope.navigatedObject).toEqual(mockDomainObject);
            });

            it("releases its navigation listener when its scope is destroyed", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );
                mockScope.$on.mostRecentCall.args[1]();
                // Should remove the listener it added earlier
                expect(mockNavigationService.removeListener).toHaveBeenCalledWith(
                    mockNavigationService.addListener.mostRecentCall.args[0]
                );
            });

        });
    }
);