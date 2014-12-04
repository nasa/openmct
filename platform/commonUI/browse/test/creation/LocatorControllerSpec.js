/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/creation/LocatorController"],
    function (LocatorController) {
        "use strict";

        describe("The locator controller", function () {
            var mockScope,
                mockDomainObject,
                mockRootObject,
                mockContext,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getCapability" ]
                );
                mockRootObject = jasmine.createSpyObj(
                    "rootObject",
                    [ "getCapability" ]
                );
                mockContext = jasmine.createSpyObj(
                    "context",
                    [ "getRoot" ]
                );

                mockDomainObject.getCapability.andReturn(mockContext);
                mockContext.getRoot.andReturn(mockRootObject);

                mockScope.ngModel = {};
                mockScope.field = "someField";

                controller = new LocatorController(mockScope);
            });

            it("adds a treeModel to scope", function () {
                expect(mockScope.treeModel).toBeDefined();
            });

            it("watches for changes to treeModel", function () {
                // This is what the embedded tree representation
                // will be modifying.
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "treeModel.selectedObject",
                    jasmine.any(Function)
                );
            });

            it("changes its own model on embedded model updates", function () {
                // Need to pass on selection changes as updates to
                // the control's value
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockScope.ngModel.someField).toEqual(mockDomainObject);
                expect(mockScope.rootObject).toEqual(mockRootObject);

                // Verify that the capability we expect to have been used
                // was used.
                expect(mockDomainObject.getCapability)
                    .toHaveBeenCalledWith("context");
            });

        });
    }
);