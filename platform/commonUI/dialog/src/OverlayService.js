/*global define*/

define(
    [],
    function () {
        "use strict";

        // Template to inject into the DOM to show the dialog; really just points to
        // the a specific template that can be included via mct-include
        var TEMPLATE = '<mct-include ng-model="overlay" key="key"></mct-include>';


        /**
         * The OverlayService is responsible for pre-pending templates to
         * the body of the document, which is useful for displaying templates
         * which need to block the full screen.
         *
         * This is intended to be used by the DialogService; by design, it
         * does not have any protections in place to prevent multiple overlays
         * from being shown at once. (The DialogService does have these
         * protections, and should be used for most overlay-type interactions,
         * particularly where a multiple-overlay effect is not specifically
         * desired).
         *
         * @constructor
         */
        function OverlayService($document, $compile, $rootScope) {
            function createOverlay(key, overlayModel) {
                // Create a new scope for this overlay
                var scope = $rootScope.$new(),
                    element;

                // Stop showing the overlay; additionally, release the scope
                // that it uses.
                function dismiss() {
                    scope.$destroy();
                    element.remove();
                }

                // If no model is supplied, just fill in a default "cancel"
                overlayModel = overlayModel || { cancel: dismiss };

                // Populate the scope; will be passed directly to the template
                scope.overlay = overlayModel;
                scope.key = key;

                // Create the overlay element and add it to the document's body
                element = $compile(TEMPLATE)(scope);
                $document.find('body').prepend(element);



                return {
                    dismiss: dismiss
                };
            }

            return {
                /**
                 * Add a new overlay to the document. This will be
                 * prepended to the document body; the overlay's
                 * template (as pointed to by the `key` argument) is
                 * responsible for having a useful z-order, and for
                 * blocking user interactions if appropriate.
                 *
                 * @param {string} key the symbolic key which identifies
                 *        the template of the overlay to be shown
                 * @param {object} overlayModel the model to pass to the
                 *        included overlay template (this will be passed
                 *        in via ng-model)
                 */
                createOverlay: createOverlay
            };
        }

        return OverlayService;
    }
);