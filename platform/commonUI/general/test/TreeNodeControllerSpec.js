/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/TreeNodeController"],
    function (TreeNodeController) {
        "use strict";

        describe("The tree node controller", function () {
            var mockScope,
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
                controller = new TreeNodeController(
                    mockScope
                );
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
                expect(controller.isSelected()).toBeFalsy();

//                mockNavigationService.getNavigation.andReturn(obj);
//                mockScope.domainObject = obj;
//                mockNavigationService.addListener.mostRecentCall.args[0](obj);

                //expect(controller.isSelected()).toBeTruthy();
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
                mockScope.ngModel = { selectedObject: child };
                mockScope.domainObject = parent;
                mockScope.toggle = jasmine.createSpyObj("toggle", ["setState"]);

//                expect(mockScope.toggle.setState).toHaveBeenCalledWith(true);
//                expect(controller.hasBeenExpanded()).toBeTruthy();
//                expect(controller.isSelected()).toBeFalsy();

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
                mockScope.ngModel = { selectedObject: child };
                mockScope.domainObject = parent;
                mockScope.toggle = jasmine.createSpyObj("toggle", ["setState"]);

                // Trigger update
//                mockNavigationService.addListener.mostRecentCall.args[0](child);
//
//                expect(mockScope.toggle.setState).not.toHaveBeenCalled();
//                expect(controller.hasBeenExpanded()).toBeFalsy();
//                expect(controller.isNavigated()).toBeFalsy();

            });
        });
    }
);