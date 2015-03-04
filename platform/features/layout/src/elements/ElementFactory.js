/*global define*/

define(
    [],
    function () {
        "use strict";

        var INITIAL_STATES = {
                "fixed.image": {
                    stroke: "transparent"
                },
                "fixed.box": {
                    fill: "#717171",
                    border: "transparent",
                    stroke: "transparent"
                },
                "fixed.line": {
                    x: 5,
                    y: 9,
                    x2: 6,
                    y2: 6,
                    stroke: "#717171"
                },
                "fixed.text": {
                    fill: "transparent",
                    stroke: "transparent",
                    color: "#cccccc"
                },
                "fixed.telemetry": {
                    stroke: "transparent",
                    color: "#cccccc",
                    titled: true,
                    width: 2,
                    height: 1
                }
            },
            DIALOGS = {
                "fixed.image": {
                    name: "Image Properties",
                    sections: [
                        {
                            rows: [
                                {
                                    key: "url",
                                    control: "textfield",
                                    name: "Image URL",
                                    required: true
                                }
                            ]
                        }
                    ]
                },
                "fixed.text": {
                    name: "Text Element Properties",
                    sections: [
                        {
                            rows: [
                                {
                                    key: "text",
                                    control: "textfield",
                                    name: "Text",
                                    required: true
                                }
                            ]
                        }
                    ]
                }
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