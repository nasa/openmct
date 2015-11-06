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
         * Controller for views of a Clock domain object.
         *
         * @constructor
         */
        function ClockController($scope, tickerService) {
            var text,
                ampm,
                use24,
                lastTimestamp,
                unlisten,
                timeFormat;

            function update() {
                var m = moment.utc(lastTimestamp);
                text = timeFormat && m.format(timeFormat);
                ampm = m.format("A"); // Just the AM or PM part
            }

            function tick(timestamp) {
                lastTimestamp = timestamp;
                update();
            }

            function updateFormat(clockFormat) {
                var baseFormat;

                if (clockFormat !== undefined) {
                    baseFormat = clockFormat[0];

                    use24 = clockFormat[1] === 'clock24';
                    timeFormat = use24 ?
                            baseFormat.replace('hh', "HH") : baseFormat;

                    update();
                }
            }
            // Pull in the clock format from the domain object model
            $scope.$watch('model.clockFormat', updateFormat);

            // Listen for clock ticks ... and stop listening on destroy
            unlisten = tickerService.listen(tick);
            $scope.$on('$destroy', unlisten);

            return {
                /**
                 * Get the clock's time zone, as displayable text.
                 * @returns {string}
                 */
                zone: function () {
                    return "UTC";
                },
                /**
                 * Get the current time, as displayable text.
                 * @returns {string}
                 */
                text: function () {
                    return text;
                },
                /**
                 * Get the text to display to qualify a time as AM or PM.
                 * @returns {string}
                 */
                ampm: function () {
                    return use24 ? '' : ampm;
                }
            };
        }

        return ClockController;
    }
);
