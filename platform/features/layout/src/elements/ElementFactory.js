/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
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
                    stroke: "transparent"
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
         * @memberof platform/features/layout
         * @constructor
         */
        function ElementFactory(dialogService) {
            this.dialogService = dialogService;
        }

        /**
         * Create a new element for the fixed position view.
         * @param {string} type the type of element to create
         * @returns {Promise|object} the created element, or a promise
         *          for that element
         */
        ElementFactory.prototype.createElement = function (type) {
            var initialState = INITIAL_STATES[type] || {};

            // Clone that state
            initialState = JSON.parse(JSON.stringify(initialState));

            // Show a dialog to configure initial state, if appropriate
            return DIALOGS[type] ? this.dialogService.getUserInput(
                DIALOGS[type],
                initialState
            ) : initialState;
        };

        return ElementFactory;
    }
);
