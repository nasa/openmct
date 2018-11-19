/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([],
    function () {
        const DEFAULT_DIMENSIONS = [2, 1],
            DEFAULT_X = 1,
            DEFAULT_Y = 1,
            INITIAL_STATES = {
                "image": {
                    stroke: "transparent"
                },
                "box": {
                    fill: "#717171",
                    border: "transparent",
                    stroke: "transparent"
                },
                "line": {
                    x: 5,
                    y: 3,
                    x2: 6,
                    y2: 6,
                    stroke: "#717171"
                },
                "text": {
                    fill: "transparent",
                    stroke: "transparent",
                    size: "13px"
                }
            },
            DIALOGS = {
                "image": {
                    name: "Image Properties",
                    sections: [
                        {
                            rows: [
                                {
                                    key: "url",
                                    control: "textfield",
                                    name: "Image URL",
                                    "cssClass": "l-input-lg",
                                    required: true
                                }
                            ]
                        }
                    ]
                },
                "text": {
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
         * display layout view, prompting for user input where necessary.
         *
         */
        class ElementFactory {

            constructor() {

            }

            /**
             * Creates a new element.
             *
             * @param {string} type the type of element to create
             * @returns {Promise|object} the created element, or a promise
             *          for that element
             */
            createElement(type) {
                let initialState = INITIAL_STATES[type] || {};
                initialState = JSON.parse(JSON.stringify(initialState));
                initialState.position = [initialState.x || DEFAULT_X, initialState.y || DEFAULT_Y];
                initialState.dimensions = DEFAULT_DIMENSIONS;
                // Show a dialog to configure initial state, if appropriate
                // return DIALOGS[type] ? dialog.getUserInput(
                //     DIALOGS[type],
                //     initialState
                // ) : initialState;
                return initialState;
            }
        }

        return ElementFactory;
    }
);
