/*global define,Promise*/

define(
    [],
    function () {
        "use strict";

        /**
         * A ToggleController is used to activate/deactivate things.
         * A common usage is for "twistie"
         *
         * @constructor
         */
        function ToggleController() {
            var state = false;

            return {
                /**
                 * Get the current state of the toggle.
                 * @return {boolean} true if active
                 */
                isActive: function () {
                    return state;
                },
                /**
                 * Set a new state for the toggle.
                 * @return {boolean} true to activate
                 */
                setState: function (newState) {
                    state = newState;
                },
                /**
                 * Toggle the current state; activate if it is inactive,
                 * deactivate if it is active.
                 */
                toggle: function () {
                    state = !state;
                }
            };

        }

        return ToggleController;
    }
);