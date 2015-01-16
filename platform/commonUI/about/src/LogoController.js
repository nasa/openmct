/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * The LogoController provides functionality to the application
         * logo in the bottom-right of the user interface.
         * @constructor
         * @param {OverlayService} overlayService the overlay service
         */
        function LogoController(overlayService) {
            return {
                /**
                 * Display the About dialog.
                 * @memberof LogoController#
                 */
                showAboutDialog: function () {
                    overlayService.createOverlay("overlay-about");
                }
            };
        }

        return LogoController;
    }
);