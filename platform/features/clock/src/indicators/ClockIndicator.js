/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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

define(
    ['moment'],
    function (moment) {

        /**
         * Indicator that displays the current UTC time in the status area.
         * @implements {Indicator}
         * @memberof platform/features/clock
         * @param {platform/features/clock.TickerService} tickerService
         *        a service used to align behavior with clock ticks
         * @param {string} indicatorFormat format string for timestamps
         *        shown in this indicator
         */
        function ClockIndicator(tickerService, indicatorFormat) {
            var self = this;

            this.text = "";

            tickerService.listen(function (timestamp) {
                self.text = moment.utc(timestamp)
                    .format(indicatorFormat) + " UTC";
            });
        }

        ClockIndicator.prototype.getGlyphClass = function () {
            return "";
        };

        ClockIndicator.prototype.getCssClass = function () {
            return "t-indicator-clock icon-clock no-minify c-indicator--not-clickable";
        };

        ClockIndicator.prototype.getText = function () {
            return this.text;
        };

        ClockIndicator.prototype.getDescription = function () {
            return "";
        };

        return ClockIndicator;
    }
);
