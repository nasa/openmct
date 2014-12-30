/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/ToggleController"],
    function (ToggleController) {
        "use strict";

        describe("The toggle controller", function () {
            var controller;

            beforeEach(function () {
                controller = new ToggleController();
            });

            it("is initially inactive", function () {
                expect(controller.isActive()).toBe(false);
            });

            it("tracks enabled/disabled state when toggled", function () {
                controller.toggle();
                expect(controller.isActive()).toBe(true);
                controller.toggle();
                expect(controller.isActive()).toBe(false);
                controller.toggle();
                expect(controller.isActive()).toBe(true);
                controller.toggle();
                expect(controller.isActive()).toBe(false);
            });

            it("allows active state to be explictly specified", function () {
                controller.setState(true);
                expect(controller.isActive()).toBe(true);
                controller.setState(true);
                expect(controller.isActive()).toBe(true);
                controller.setState(false);
                expect(controller.isActive()).toBe(false);
                controller.setState(false);
                expect(controller.isActive()).toBe(false);
            });

        });
    }
);