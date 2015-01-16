/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ['../src/LogoController'],
    function (LogoController) {
        "use strict";

        describe("The About controller", function () {
            var mockOverlayService,
                controller;

            beforeEach(function () {
                mockOverlayService = jasmine.createSpyObj(
                    "overlayService",
                    ["createOverlay"]
                );
                controller = new LogoController(mockOverlayService);
            });

            it("shows the about dialog", function () {
                //Verify precondition
                expect(mockOverlayService.createOverlay)
                    .not.toHaveBeenCalled();
                controller.showAboutDialog();
                expect(mockOverlayService.createOverlay)
                    .toHaveBeenCalledWith("overlay-about");
            });

        });

    }
);