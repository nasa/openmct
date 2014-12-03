/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/MCTForm"],
    function (MCTForm) {
        "use strict";

        describe("The mct-form directive", function () {
            var mockScope,
                mctForm;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", [ "$watch" ]);
                mockScope.$parent = {};
                mctForm = new MCTForm();
            });

            it("is restricted to elements", function () {
                expect(mctForm.restrict).toEqual("E");
            });

            it("watches for changes in form by name", function () {
                // mct-form needs to watch for the form by name
                // in order to convey changes in $valid, $dirty, etc
                // up to the parent scope.
                mctForm.controller(mockScope);

                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "mctForm",
                    jasmine.any(Function)
                );
            });

            it("conveys form status to parent scope", function () {
                var someState = { someKey: "some value" };
                mockScope.name = "someName";

                mctForm.controller(mockScope);

                mockScope.$watch.mostRecentCall.args[1](someState);

                expect(mockScope.$parent.someName).toBe(someState);
            });

            it("allows strings to be converted to RegExps", function () {
                // This is needed to support ng-pattern in the template
                mctForm.controller(mockScope);

                // Should have added getRegExp to the scope,
                // to convert strings to regular expressions
                expect(mockScope.getRegExp("^\\d+$")).toEqual(/^\d+$/);
            });

            it("returns the same regexp instance for the same string", function () {
                // Don't want new instances each digest cycle, for performance
                var strRegExp = "^[a-z]\\d+$",
                    regExp;

                // Add getRegExp to scope
                mctForm.controller(mockScope);
                regExp = mockScope.getRegExp(strRegExp);

                // Same object instance each time...
                expect(mockScope.getRegExp(strRegExp)).toBe(regExp);
                expect(mockScope.getRegExp(strRegExp)).toBe(regExp);
            });

            it("passes RegExp objects through untouched", function () {
                // Permit using forms to simply provide their own RegExp object
                var regExp = /^\d+[a-d]$/;

                // Add getRegExp to scope
                mctForm.controller(mockScope);

                // Should have added getRegExp to the scope,
                // to convert strings to regular expressions
                expect(mockScope.getRegExp(regExp)).toBe(regExp);
            });

            it("passes a non-whitespace regexp when no pattern is defined", function () {
                // If no pattern is supplied, ng-pattern should match anything
                mctForm.controller(mockScope);
                expect(mockScope.getRegExp()).toEqual(/\S/);
                expect(mockScope.getRegExp(undefined)).toEqual(/\S/);
            });


        });
    }
);