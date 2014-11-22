/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTIncudeSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/MCTInclude"],
    function (MCTInclude) {
        "use strict";

        describe("The mct-include directive", function () {
            var testTemplates,
                mctInclude;

            beforeEach(function () {
                testTemplates = [
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
                mctInclude = new MCTInclude(testTemplates);
            });

            it("has a built-in template, with ng-include src=inclusion", function () {
                // Not rigorous, but should detect many cases when template is broken.
                expect(mctInclude.template.indexOf("ng-include")).not.toEqual(-1);
                expect(mctInclude.template.indexOf("inclusion")).not.toEqual(-1);
            });

            it("is restricted to elements", function () {
                expect(mctInclude.restrict).toEqual("E");
            });

            it("reads a template location from a scope's key variable", function () {
                var scope = { key: "abc" };
                mctInclude.controller(scope);
                expect(scope.inclusion).toEqual("a/b/c/template.html");

                scope = { key: "xyz" };
                mctInclude.controller(scope);
                expect(scope.inclusion).toEqual("x/y/z/template.html");
            });

        });
    }
);