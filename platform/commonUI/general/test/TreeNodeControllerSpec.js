/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/TreeNodeController"],
    function (TreeNodeController) {
        "use strict";

        describe("The tree node controller", function () {
            var mockScope,
                mockNavigationService,
                controller;

            function TestObject(id, context) {
                return {
                    getId: function () { return id; },
                    getCapability: function (key) {
                        return key === 'context' ? context : undefined;
                    }
                };
            }

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch", "$on" ]
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
                controller = new TreeNodeController(
                    mockScope,
                    mockNavigationService
                );
            });

            it("listens for navigation changes", function () {
                expect(mockNavigationService.addListener)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("allows tracking of expansion state", function () {
                // The tree node tracks whether or not it has ever
                // been expanded in order to lazily load the expanded
                // portion of the tree.
                expect(controller.hasBeenExpanded()).toBeFalsy();
                controller.trackExpansion();
                expect(controller.hasBeenExpanded()).toBeTruthy();
                controller.trackExpansion();
                expect(controller.hasBeenExpanded()).toBeTruthy();
            });

            it("tracks whether or not the represented object is currently navigated-to", function () {
                // This is needed to highlight the current selection
                var mockContext = jasmine.createSpyObj(
                        "context",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    obj = new TestObject("test-object", mockContext);

                mockContext.getPath.andReturn([obj]);

                // Verify precondition
                expect(controller.isNavigated()).toBeFalsy();

                mockNavigationService.getNavigation.andReturn(obj);
                mockScope.domainObject = obj;
                mockNavigationService.addListener.mostRecentCall.args[0](obj);

                expect(controller.isNavigated()).toBeTruthy();
            });

            it("expands a node if it is on the navigation path", function () {
                var mockParentContext = jasmine.createSpyObj(
                        "parentContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    mockChildContext = jasmine.createSpyObj(
                        "childContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    parent = new TestObject("parent", mockParentContext),
                    child = new TestObject("child", mockChildContext);

                mockChildContext.getParent.andReturn(parent);
                mockChildContext.getPath.andReturn([parent, child]);
                mockParentContext.getPath.andReturn([parent]);

                // Set up such that we are on, but not at the end of, a path
                mockNavigationService.getNavigation.andReturn(child);
                mockScope.domainObject = parent;
                mockScope.toggle = jasmine.createSpyObj("toggle", ["setState"]);

                // Trigger update
                mockNavigationService.addListener.mostRecentCall.args[0](child);

                expect(mockScope.toggle.setState).toHaveBeenCalledWith(true);
                expect(controller.hasBeenExpanded()).toBeTruthy();
                expect(controller.isNavigated()).toBeFalsy();

            });

            it("does not expand a node if no context is available", function () {
                var mockParentContext = jasmine.createSpyObj(
                        "parentContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    mockChildContext = jasmine.createSpyObj(
                        "childContext",
                        [ "getParent", "getPath", "getRoot" ]
                    ),
                    parent = new TestObject("parent", mockParentContext),
                    child = new TestObject("child", undefined);

                mockChildContext.getParent.andReturn(parent);
                mockChildContext.getPath.andReturn([parent, child]);
                mockParentContext.getPath.andReturn([parent]);

                // Set up such that we are on, but not at the end of, a path
                mockNavigationService.getNavigation.andReturn(child);
                mockScope.domainObject = parent;
                mockScope.toggle = jasmine.createSpyObj("toggle", ["setState"]);

                // Trigger update
                mockNavigationService.addListener.mostRecentCall.args[0](child);

                expect(mockScope.toggle.setState).not.toHaveBeenCalled();
                expect(controller.hasBeenExpanded()).toBeFalsy();
                expect(controller.isNavigated()).toBeFalsy();

            });

            it("removes its navigation listener when the scope is destroyed", function () {
                var navCallback =
                    mockNavigationService.addListener.mostRecentCall.args[0];

                // Make sure the controller is listening in the first place
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );

                // Verify precondition - no removeListener called
                expect(mockNavigationService.removeListener)
                    .not.toHaveBeenCalled();

                // Call that listener (act as if scope is being destroyed)
                mockScope.$on.mostRecentCall.args[1]();

                // Verify precondition - no removeListener called
                expect(mockNavigationService.removeListener)
                    .toHaveBeenCalledWith(navCallback);
            });


        });
    }
);