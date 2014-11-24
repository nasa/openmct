/*global define,Promise*/

define(
    [],
    function () {
        "use strict";

        /**
         * A ClickAwayController is used to toggle things (such as context
         * menus) where clicking elsewhere in the document while the toggle
         * is in an active state is intended to dismiss the toggle.
         *
         * @constructor
         * @param $scope the scope in which this controller is active
         * @param $document the document element, injected by Angular
         */
        function ClickAwayController($scope, $document) {
            var state = false,
                clickaway;

            // Track state, but also attach and detach a listener for
            // mouseup events on the document.
            function deactivate() {
                state = false;
                $document.off("mouseup", clickaway);
            }

            function activate() {
                state = true;
                $document.on("mouseup", clickaway);
            }

            function changeState() {
                if (state) {
                    deactivate();
                } else {
                    activate();
                }
            }

            // Callback used by the document listener. Deactivates;
            // note also $scope.$apply is invoked to indicate that
            // the state of this controller has changed.
            clickaway = function () {
                deactivate();
                $scope.$apply();
                return false;
            };

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
                    if (state !== newState) {
                        changeState();
                    }
                },
                /**
                 * Toggle the current state; activate if it is inactive,
                 * deactivate if it is active.
                 */
                toggle: function () {
                    changeState();
                }
            };

        }

        return ClickAwayController;
    }
);