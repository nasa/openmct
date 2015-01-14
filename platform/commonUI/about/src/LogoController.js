/*global define*/

define(
    [],
    function () {
        "use strict";

        function LogoController(overlayService) {
            return {
                showAboutDialog: function () {
                    overlayService.createOverlay("overlay-about");
                }
            };
        }

        return LogoController;
    }
);