/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/SplitPaneController"],
    function (SplitPaneController) {
        "use strict";

        describe("The split pane controller", function () {
            var controller;

            beforeEach(function () {
                controller = new SplitPaneController();
            });

            it("has an initial position", function () {
                expect(controller.state() > 0).toBeTruthy();
            });

            it("can be moved", function () {
                var initialState = controller.state();
                controller.startMove();
                controller.move(50);
                expect(controller.state()).toEqual(initialState + 50);
            });

            it("clamps its position", function () {
                var initialState = controller.state();
                controller.startMove();
                // Move some really extreme number
                controller.move(-100000);
                // Shouldn't have moved below 0...
                expect(controller.state() > 0).toBeTruthy();
                // ...but should have moved left somewhere
                expect(controller.state() < initialState).toBeTruthy();

                // Then do the same to the right
                controller.move(100000);
                // Shouldn't have moved below 0...
                expect(controller.state() < 100000).toBeTruthy();
                // ...but should have moved left somewhere
                expect(controller.state() > initialState).toBeTruthy();
            });

            it("accepts a default state", function () {
                // Should use default state the first time...
                expect(controller.state(12321)).toEqual(12321);
                // ...but not after it's been initialized
                expect(controller.state(42)).toEqual(12321);
            });

        });
    }
);