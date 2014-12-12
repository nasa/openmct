/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/modes/PlotOverlayMode"],
    function (PlotOverlayMode) {
        "use strict";

        describe("Overlaid plot mode", function () {
            var testDrawingObject;


            it("draws all lines to one subplot", function () {

                // Should have put some lines in the drawing scope,
                // which the template should pass along to the renderer
                //expect(testDrawingObject.lines).toBeDefined();
            });

        });
    }
);