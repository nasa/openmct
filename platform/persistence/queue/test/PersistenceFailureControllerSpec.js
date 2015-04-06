/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/


define(
    ["../src/PersistenceFailureController"],
    function (PersistenceFailureController) {
        "use strict";

        describe("The persistence failure controller", function () {
            var controller;

            beforeEach(function () {
                controller = new PersistenceFailureController();
            });

            it("converts timestamps to human-readable dates", function () {
                expect(controller.formatTimestamp(402514331000))
                    .toEqual("1982-10-03 17:32:11Z");
            });

            it("provides default user names", function () {
                expect(controller.formatUsername(undefined))
                    .toEqual(jasmine.any(String));
            });
        });
    }
);