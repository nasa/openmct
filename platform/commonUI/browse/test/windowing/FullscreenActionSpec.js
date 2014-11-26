/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine,afterEach,screenfull*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/windowing/FullscreenAction"],
    function (FullscreenAction) {
        "use strict";

        describe("The fullscreen action", function () {
            var action,
                oldToggle;

            beforeEach(function () {
                // Screenfull is not shimmed or injected, so
                // we need to spy on it in the global scope.
                oldToggle = screenfull.toggle;

                screenfull.toggle = jasmine.createSpy("toggle");

                action = new FullscreenAction({});
            });

            afterEach(function () {
                screenfull.toggle = oldToggle;
            });

            it("toggles fullscreen mode when performed", function () {
                action.perform();
                expect(screenfull.toggle).toHaveBeenCalled();
            });

            it("provides displayable metadata", function () {
                expect(action.getMetadata().glyph).toBeDefined();
            });

        });
    }
);