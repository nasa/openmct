/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/ActionGroupController"],
    function (ActionGroupController) {
        "use strict";

        describe("The action group controller", function () {
            var mockScope,
                mockActions,
                controller;

            function mockAction(metadata, index) {
                var action = jasmine.createSpyObj(
                    "action" + index,
                    ["perform", "getMetadata"]
                );
                action.getMetadata.andReturn(metadata);
                return action;
            }

            beforeEach(function () {
                mockActions = jasmine.createSpyObj("action", ["getActions"]);
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                controller = new ActionGroupController(mockScope);
            });

            it("watches scope that may change applicable actions", function () {
                // The action capability
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "action",
                    jasmine.any(Function)
                );
                // The category of action to load
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "parameters.category",
                    jasmine.any(Function)
                );
            });

            it("populates the scope with grouped and ungrouped actions", function () {
                mockScope.action = mockActions;
                mockScope.parameters = { category: "test" };

                mockActions.getActions.andReturn([
                    { group: "a", someKey: 0 },
                    { group: "a", someKey: 1 },
                    { group: "b", someKey: 2 },
                    { group: "a", someKey: 3 },
                    { group: "b", someKey: 4 },
                    { someKey: 5 },
                    { someKey: 6 },
                    { group: "a", someKey: 7 },
                    { someKey: 8 }
                ].map(mockAction));

                // Call the watch
                mockScope.$watch.mostRecentCall.args[1]();

                // Should have grouped and ungrouped actions in scope now
                expect(mockScope.groups.length).toEqual(2);
                expect(mockScope.groups[0].length).toEqual(4); // a
                expect(mockScope.groups[1].length).toEqual(2); // b
                expect(mockScope.ungrouped.length).toEqual(3); // ungrouped
            });
        });
    }
);