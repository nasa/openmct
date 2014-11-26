/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/creation/CreateMenuController"],
    function (CreateMenuController) {
        "use strict";

        describe("The create menu controller", function () {
            var mockScope,
                mockActions,
                controller;

            beforeEach(function () {
                mockActions = jasmine.createSpyObj("action", ["getActions"]);
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                controller = new CreateMenuController(mockScope);
            });

            it("watches scope that may change applicable actions", function () {
                // The action capability
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "action",
                    jasmine.any(Function)
                );
            });

            it("populates the scope with create actions", function () {
                mockScope.action = mockActions;

                mockActions.getActions.andReturn(["a", "b", "c"]);

                // Call the watch
                mockScope.$watch.mostRecentCall.args[1]();

                // Should have grouped and ungrouped actions in scope now
                expect(mockScope.createActions.length).toEqual(3);

                // Make sure the right action type was requested
                expect(mockActions.getActions).toHaveBeenCalledWith("create");
            });
        });
    }
);