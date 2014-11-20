/*global define,Promise,describe,it,expect,beforeEach*/

/**
 * PartialConstructorSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/register/PartialConstructor"],
    function (PartialConstructor) {
        "use strict";

        describe("A partial constructor", function () {
            var result,
                PartializedConstructor;

            function RegularConstructor(a, b, c, d) {
                result = {
                    a: a,
                    b: b,
                    c: c,
                    d: d
                };
                return result;
            }

            function ThisStyleConstructor(x, y, z) {
                this.message = [x, y, z].join(" ");
            }

            RegularConstructor.someProperty = "test property";

            beforeEach(function () {
                result = undefined;
                PartializedConstructor = new PartialConstructor(RegularConstructor);
            });

            it("splits a constructor call into two stages", function () {
                var RemainingConstructor = new PartializedConstructor("test"),
                    instance;
                // first call should not have hit constructor
                expect(result).toBeUndefined();

                // Call again
                instance = new RemainingConstructor(1, 2, 3);
                expect(result).toEqual({
                    a: "test",
                    b: 1,
                    c: 2,
                    d: 3
                });

                // Should have returned the constructor's value
                expect(instance).toEqual(result);
            });

            it("handles this-style constructors", function () {
                var Partialized = new PartialConstructor(ThisStyleConstructor),
                    Remaining = new Partialized("this"),
                    instance = new Remaining("is", "correct");

                // We should have everything we put in "this", and we
                // should still pass an instanceof test.g
                expect(instance.message).toEqual("this is correct");
                expect(instance).toEqual(new ThisStyleConstructor("this", "is", "correct"));
                expect(instance instanceof ThisStyleConstructor).toBeTruthy();
            });

            it("retains static properties after partialization", function () {
                // This string should appear after invoking the partialized
                // constructor, such that the resulting inner constructor
                // exposes these as if we were looking at the original
                // RegularConstructor.
                expect(new PartializedConstructor().someProperty).toEqual("test property");
            });

        });
    }
);