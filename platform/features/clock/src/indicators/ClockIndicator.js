/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
    ['moment'],
    function (moment) {
        "use strict";

        /**
         * Indicator that displays the current UTC time in the status area.
         * @implements Indicator
         */
        function ClockIndicator(tickerService, CLOCK_INDICATOR_FORMAT) {
            var text = "";

            tickerService.listen(function (timestamp) {
                text = moment.utc(timestamp).format(CLOCK_INDICATOR_FORMAT) + " UTC";
            });

            return {
                getGlyph: function () {
                    return "C";
                },
                getGlyphClass: function () {
                    return "";
                },
                getText: function () {
                    return text;
                },
                getDescription: function () {
                    return "";
                }
            };

        }

        return ClockIndicator;
    }
);
