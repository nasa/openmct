/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/directives/MCTContainer"],
    function (MCTContainer) {
        "use strict";

        describe("The mct-container directive", function () {
            var testContainers = [
                    {
                        bundle: { path: "a", resources: "b" },
                        templateUrl: "c/template.html",
                        key: "abc"
                    },
                    {
                        bundle: { path: "x", resources: "y" },
                        templateUrl: "z/template.html",
                        key: "xyz",
                        attributes: [ "someAttr", "someOtherAttr" ]
                    }
                ],
                mctContainer;

            beforeEach(function () {
                mctContainer = new MCTContainer(testContainers);
            });

            it("is applicable to elements", function () {
                expect(mctContainer.restrict).toEqual("E");
            });

            it("creates a new (non-isolate) scope", function () {
                expect(mctContainer.scope).toBe(true);
            });

            it("chooses a template based on key", function () {
                expect(mctContainer.templateUrl(
                    undefined,
                    { key: "abc" }
                )).toEqual("a/b/c/template.html");

                expect(mctContainer.templateUrl(
                    undefined,
                    { key: "xyz" }
                )).toEqual("x/y/z/template.html");
            });

            it("copies attributes needed by the container", function () {
                var scope = {};

                mctContainer.link(
                    scope,
                    undefined,
                    {
                        key: "xyz",
                        someAttr: "some value",
                        someOtherAttr: "some other value",
                        someExtraAttr: "should not be present"
                    }
                );

                expect(scope.container.someAttr).toEqual("some value");
                expect(scope.container.someOtherAttr).toEqual("some other value");
                expect(scope.container.someExtraAttr).toBeUndefined();
            });

        });
    }
);