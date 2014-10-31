/*global define,describe,it,expect*/

define(
    ["../src/Temporary"],
    function (Temporary) {
        "use strict";

        describe("Temporary class", function () {
            var temporary = new Temporary();

            it("has a method with a return value", function () {
                expect(temporary.someMethod()).toEqual("returnValue");
            });
        });

    }
);