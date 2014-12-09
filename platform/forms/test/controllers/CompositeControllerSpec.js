/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/CompositeController"],
    function (CompositeController) {
        "use strict";

        describe("The composite controller", function () {
            var controller;

            beforeEach(function () {
                controller = new CompositeController();
            });

            it("detects non-empty arrays", function () {
                expect(controller.isNonEmpty(["a", "b", undefined]))
                    .toBeTruthy();
                expect(controller.isNonEmpty([3]))
                    .toBeTruthy();
            });

            it("detects empty arrays", function () {
                expect(controller.isNonEmpty([undefined, undefined, undefined]))
                    .toBeFalsy();
                expect(controller.isNonEmpty([]))
                    .toBeFalsy();
            });

            it("ignores non-arrays", function () {
                expect(controller.isNonEmpty("this is not an array"))
                    .toBeFalsy();
            });

        });
    }
);