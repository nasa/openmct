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

        /**
         * Updates a count of currently-active Angular watches.
         * @constructor
         * @param $interval Angular's $interval
         */
        function WatchIndicator($interval, $rootScope) {
            var watches = 0;

            function count(scope) {
                if (scope) {
                    watches += (scope.$$watchers || []).length;
                    count(scope.$$childHead);
                    count(scope.$$nextSibling);
                }
            }

            function update() {
                watches = 0;
                count($rootScope);
            }

            // Update state every second
            $interval(update, 1000);

            // Provide initial state, too
            update();

            return {
                /**
                 * Get the glyph (single character used as an icon)
                 * to display in this indicator. This will return ".",
                 * which should appear as a dataflow icon.
                 * @returns {string} the character of the database icon
                 */
                getGlyph: function () {
                    return "E";
                },
                /**
                 * Get the name of the CSS class to apply to the glyph.
                 * This is used to color the glyph to match its
                 * state (one of ok, caution or err)
                 * @returns {string} the CSS class to apply to this glyph
                 */
                getGlyphClass: function () {
                    return (watches > 2000) ? "caution" :
                            (watches < 1000) ? "ok" :
                                    undefined;
                },
                /**
                 * Get the text that should appear in the indicator.
                 * @returns {string} brief summary of connection status
                 */
                getText: function () {
                    return watches + " watches";
                },
                /**
                 * Get a longer-form description of the current connection
                 * space, suitable for display in a tooltip
                 * @returns {string} longer summary of connection status
                 */
                getDescription: function () {
                    return "";
                }
            };
        }

        return WatchIndicator;

    }
);