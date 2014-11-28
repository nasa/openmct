/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/MCTControl"],
    function (MCTControl) {
        "use strict";

        describe("The mct-control directive", function () {
            var testControls,
                mockScope,
                mctControl;

            beforeEach(function () {
                testControls = [
                    {
                        key: "abc",
                        bundle: { path: "a", resources: "b" },
                        templateUrl: "c/template.html"
                    },
                    {
                        key: "xyz",
                        bundle: { path: "x", resources: "y" },
                        templateUrl: "z/template.html"
                    }
                ];

                mockScope = jasmine.createSpyObj("$scope", [ "$watch" ]);

                mctControl = new MCTControl(testControls);
            });

            it("is restricted to the element level", function () {
                expect(mctControl.restrict).toEqual("E");
            });

            it("watches its passed key to choose a template", function () {
                mctControl.controller(mockScope);

                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "key",
                    jasmine.any(Function)
                );
            });

            it("changes its template dynamically", function () {
                mctControl.controller(mockScope);

                mockScope.key = "xyz";
                mockScope.$watch.mostRecentCall.args[1]("xyz");

                // Should have communicated the template path to
                // ng-include via the "inclusion" field in scope
                expect(mockScope.inclusion).toEqual(
                    "x/y/z/template.html"
                );
            });

        });
    }
);