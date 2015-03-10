/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/controllers/EditActionController"],
    function (EditActionController) {
        "use strict";

        describe("The Edit Action controller", function () {
            var mockScope,
                mockActions,
                controller;

            beforeEach(function () {
                mockActions = jasmine.createSpyObj("action", ["getActions"]);
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                controller = new EditActionController(mockScope);
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

                mockActions.getActions.andReturn(["a", "b", "c"]);

                // Call the watch
                mockScope.$watch.mostRecentCall.args[1]();

                // Should have grouped and ungrouped actions in scope now
                expect(mockScope.editActions.length).toEqual(3);
            });
        });
    }
);