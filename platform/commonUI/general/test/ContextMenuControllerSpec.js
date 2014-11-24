/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/ContextMenuController"],
    function (ContextMenuController) {
        "use strict";

        describe("The context menu controller", function () {
            var mockScope,
                mockActions,
                controller;

            beforeEach(function () {
                mockActions = jasmine.createSpyObj("action", ["getActions"]);
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                controller = new ContextMenuController(mockScope);
            });

            it("watches scope that may change applicable actions", function () {
                // The action capability
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "action",
                    jasmine.any(Function)
                );
            });

            it("populates the scope with grouped and ungrouped actions", function () {
                mockScope.action = mockActions;
                mockScope.parameters = { category: "test" };

                mockActions.getActions.andReturn(["a", "b", "c"]);

                // Call the watch
                mockScope.$watch.mostRecentCall.args[1]();

                // Should have grouped and ungrouped actions in scope now
                expect(mockScope.menuActions.length).toEqual(3);
            });
        });
    }
);