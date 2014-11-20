/*global define,describe,it,xit,expect,beforeEach*/

define(
    ['../../src/types/TypePropertyConversion'],
    function (TypePropertyConversion) {
        "use strict";

        describe("Type property conversion", function () {

            it("allows non-conversion when parameter is 'identity'", function () {
                var conversion = new TypePropertyConversion("identity");
                [ 42, "42", { a: 42 } ].forEach(function (v) {
                    expect(conversion.toFormValue(v)).toBe(v);
                    expect(conversion.toModelValue(v)).toBe(v);
                });
            });

            it("allows numeric conversion", function () {
                var conversion = new TypePropertyConversion("number");
                expect(conversion.toFormValue(42)).toBe("42");
                expect(conversion.toModelValue("42")).toBe(42);
            });

            it("supports array conversions", function () {
                var conversion = new TypePropertyConversion("number[]");
                expect(conversion.toFormValue([42, 44]).length).toEqual(2);
                expect(conversion.toFormValue([42, 44])[0]).toBe("42");
                expect(conversion.toModelValue(["11", "42"])[1]).toBe(42);
            });

            it("throws exceptions on unrecognized conversions", function () {
                var caught = false, tmp;

                try {
                    tmp = new TypePropertyConversion("some-unknown-conversion");
                } catch (e) {
                    caught = true;
                }

                expect(caught).toBeTruthy();
            });

        });
    }
);