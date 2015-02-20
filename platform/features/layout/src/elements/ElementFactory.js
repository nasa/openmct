/*global define*/

define(
    [],
    function () {
        "use strict";

        var INITIAL_STATES = {
                "fixed.image": {
                    url: "http://www.nasa.gov/sites/default/themes/NASAPortal/images/nasa-logo.gif"
                }
            },
            DIALOGS = {

            };

        /**
         * The ElementFactory creates new instances of elements for the
         * fixed position view, prompting for user input where necessary.
         * @param {DialogService} dialogService service to request user input
         * @constructor
         */
        function ElementFactory(dialogService) {
            return {
                /**
                 * Create a new element for the fixed position view.
                 * @param {string} type the type of element to create
                 * @returns {Promise|object} the created element, or a promise
                 *          for that element
                 */
                createElement: function (type) {
                    var initialState = INITIAL_STATES[type] || {};

                    // Clone that state
                    initialState = JSON.parse(JSON.stringify(initialState));

                    // Show a dialog to configure initial state, if appropriate
                    return DIALOGS[type] ? dialogService.getUserInput(
                        DIALOGS[type],
                        initialState
                    ) : initialState;
                }
            };
        }

        return ElementFactory;
    }
);