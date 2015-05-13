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

        var DEFAULT_MAXIMUM = 1000,
            DEFAULT_MINIMUM = 120;

        /**
         * Controller for the splitter in Browse mode. Current implementation
         * uses many hard-coded constants; this could be generalized.
         * @constructor
         */
        function SplitPaneController() {
            var current = 200,
                start = 200,
                assigned = false;

            return {
                /**
                 * Get the current position of the splitter, in pixels
                 * from the left edge.
                 * @returns {number} position of the splitter, in pixels
                 */
                state: function (defaultState) {
                    // Set the state to the desired default, if we don't have a
                    // "real" current state yet.
                    if (arguments.length > 0 && !assigned) {
                        current = defaultState;
                        assigned = true;
                    }
                    return current;
                },
                /**
                 * Begin moving the splitter; this will note the splitter's
                 * current position, which is necessary for correct
                 * interpretation of deltas provided by mct-drag.
                 */
                startMove: function () {
                    start = current;
                },
                /**
                 * Move the splitter a number of pixels to the right
                 * (negative numbers move the splitter to the left.)
                 * This movement is relative to the position of the
                 * splitter when startMove was last invoked.
                 * @param {number} delta number of pixels to move
                 */
                move: function (delta, minimum, maximum) {
                    // Ensure defaults for minimum/maximum
                    maximum = isNaN(maximum) ? DEFAULT_MAXIMUM : maximum;
                    minimum = isNaN(minimum) ? DEFAULT_MINIMUM : minimum;

                    // Update current splitter state
                    current = Math.min(
                        maximum,
                        Math.max(minimum, start + delta)
                    );

	                //console.log(current + "; minimum: " + minimum + "; max: " + maximum);
                }
            };
        }

        return SplitPaneController;
    }
);