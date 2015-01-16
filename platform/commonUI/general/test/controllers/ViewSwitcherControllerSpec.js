/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/controllers/ViewSwitcherController"],
    function (ViewSwitcherController) {
        "use strict";

        describe("The view switcher controller", function () {
            var mockScope,
                mockTimeout,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", [ "$watch" ]);
                mockTimeout = jasmine.createSpy("$timeout");
                mockTimeout.andCallFake(function (cb) { cb(); });
                mockScope.ngModel = {};
                controller = new ViewSwitcherController(mockScope, mockTimeout);
            });

            it("watches for changes in applicable views", function () {
                // The view capability is used by associated
                // representations, so "view" in scope should always
                // be the list of applicable views. The view switcher
                // controller should be watching this.
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "view",
                    jasmine.any(Function)
                );
            });

            it("maintains the current selection when views change", function () {
                var views = [
                    { key: "a", name: "View A" },
                    { key: "b", name: "View B" },
                    { key: "c", name: "View C" },
                    { key: "d", name: "View D" }
                ];
                mockScope.$watch.mostRecentCall.args[1](views);
                mockScope.ngModel.selected = views[1];

                // Change the set of applicable views
                mockScope.$watch.mostRecentCall.args[1]([
                    { key: "a", name: "View A" },
                    { key: "b", name: "View B" },
                    { key: "x", name: "View X" }
                ]);

                // "b" is still in there, should remain selected
                expect(mockScope.ngModel.selected).toEqual(views[1]);
            });

            it("chooses a default if a selected view becomes inapplicable", function () {
                var views = [
                    { key: "a", name: "View A" },
                    { key: "b", name: "View B" },
                    { key: "c", name: "View C" },
                    { key: "d", name: "View D" }
                ];
                mockScope.$watch.mostRecentCall.args[1](views);
                mockScope.ngModel.selected = views[1];

                // Change the set of applicable views
                mockScope.$watch.mostRecentCall.args[1]([
                    { key: "a", name: "View A" },
                    { key: "c", name: "View C" },
                    { key: "x", name: "View X" }
                ]);

                // "b" is still in there, should remain selected
                expect(mockScope.ngModel.selected).not.toEqual(views[1]);
            });

            // Use of a timeout avoids infinite digest problems when deeply
            // nesting switcher-driven views (e.g. in a layout.) See WTD-689
            it("updates initial selection on a timeout", function () {
                // Verify precondition
                expect(mockTimeout).not.toHaveBeenCalled();

                // Invoke the watch for set of views
                mockScope.$watch.mostRecentCall.args[1]([]);

                // Should have run on a timeout
                expect(mockTimeout).toHaveBeenCalled();
            });

        });
    }
);