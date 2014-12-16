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
            // Utility function used to make indicators presentable
            // for display.
            function present(Indicator) {
                return {
                    template: Indicator.template || "indicator",
                    ngModel: typeof Indicator === 'function' ?
                            new Indicator() : Indicator
                };
            }

            indicators = indicators.map(present);

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