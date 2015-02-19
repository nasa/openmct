/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/elements/AccessorMutator'],
    function (AccessorMutator) {
        "use strict";

        describe("An accessor-mutator", function () {
            var testObject,
                am;

            beforeEach(function () {
                testObject = { t: 42, other: 100 };
                am = new AccessorMutator(testObject, 't');
            });

            it("allows access to a property", function () {
                expect(am()).toEqual(42);
            });

            it("allows mutation of a property", function () {
                expect(am("some other value")).toEqual("some other value");
                expect(testObject).toEqual({
                    t: "some other value",
                    other: 100
                });
            });

        });
    }
);
