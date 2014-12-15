/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Controller for the bottombar template. Exposes
         * available indicators (of extension category "indicators")
         * @constructor
         */
        function BottomBarController(indicators) {
            // Utility function used to instantiate indicators
            // from their injected constructors.
            function instantiate(Indicator) {
                return new Indicator();
            }

            indicators = indicators.map(instantiate);

            return {
                /**
                 * Get all indicators to display.
                 * @returns {Indicator[]} all indicators
                 *          to display in the bottom bar.
                 */
                getIndicators: function () {
                    return indicators;
                }
            };
        }

        return BottomBarController;
    }
);