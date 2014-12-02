/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/PlotController"],
    function (PlotController) {
        "use strict";

        describe("The plot controller", function () {
            var mockScope,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$watch", "$on" ]
                );
                controller = new PlotController(mockScope);
            });

            it("listens for telemetry updates", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "telemetryUpdate",
                    jasmine.any(Function)
                );
            });


        });
    }
);