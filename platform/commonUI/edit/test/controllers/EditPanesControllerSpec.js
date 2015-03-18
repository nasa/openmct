/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/controllers/EditPanesController"],
    function (EditPanesController) {
        "use strict";

        describe("The Edit Panes controller", function () {
            var mockScope,
                mockDomainObject,
                mockContext,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getId', 'getCapability' ]
                );
                mockContext = jasmine.createSpyObj(
                    'context',
                    [ 'getTrueRoot' ]
                );

                mockDomainObject.getId.andReturn('test-id');
                mockDomainObject.getCapability.andReturn(mockContext);

                // Return a new instance of the root object each time
                mockContext.getTrueRoot.andCallFake(function () {
                    var mockRoot = jasmine.createSpyObj('root', ['getId']);
                    mockRoot.getId.andReturn('root-id');
                    return mockRoot;
                });


                controller = new EditPanesController(mockScope);
            });

            it("watches for the domain object in view", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "domainObject",
                    jasmine.any(Function)
                );
            });

            it("exposes the root object found via the object's context capability", function () {
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                // Verify that the correct capability was used
                expect(mockDomainObject.getCapability)
                    .toHaveBeenCalledWith('context');

                // Should have exposed the root from getRoot
                expect(controller.getRoot().getId()).toEqual('root-id');
            });

            it("preserves the same root instance to avoid excessive refreshing", function () {
                var firstRoot;
                // Expose the domain object
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                firstRoot = controller.getRoot();
                // Update!
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                // Should still have the same object instance, to avoid
                // triggering the watch used by the template we're supporting
                expect(controller.getRoot()).toBe(firstRoot);
            });

            // Complements the test above; the object pointed to should change
            // when the actual root has changed (detected by identifier)
            it("updates the root when it changes", function () {
                var firstRoot;
                // Expose the domain object
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                firstRoot = controller.getRoot();

                // Change the exposed root
                mockContext.getTrueRoot.andCallFake(function () {
                    var mockRoot = jasmine.createSpyObj('root', ['getId']);
                    mockRoot.getId.andReturn('other-root-id');
                    return mockRoot;
                });

                // Update!
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);

                // Should still have the same object instance, to avoid
                // triggering the watch used by the template we're supporting
                expect(controller.getRoot()).not.toBe(firstRoot);
                expect(controller.getRoot().getId()).toEqual('other-root-id');
            });
        });
    }
);