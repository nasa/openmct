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

define([
    'moment',
    'moment-timezone'
],
function (
    moment,
    momentTimezone
) {

    /**
         * Controller for views of a Clock domain object.
         *
         * @constructor
         * @memberof platform/features/clock
         * @param {angular.Scope} $scope the Angular scope
         * @param {platform/features/clock.TickerService} tickerService
         *        a service used to align behavior with clock ticks
         */
    function ClockController($scope, tickerService) {
        var lastTimestamp,
            unlisten,
            timeFormat,
            zoneName,
            self = this;

        function update() {
            var m = zoneName
                ? moment.utc(lastTimestamp).tz(zoneName) : moment.utc(lastTimestamp);
            self.zoneAbbr = m.zoneAbbr();
            self.textValue = timeFormat && m.format(timeFormat);
            self.ampmValue = m.format("A"); // Just the AM or PM part
        }

        function tick(timestamp) {
            lastTimestamp = timestamp;
            update();
        }

        function updateModel(model) {
            var baseFormat;
            if (model !== undefined) {
                baseFormat = model.clockFormat[0];

                self.use24 = model.clockFormat[1] === 'clock24';
                timeFormat = self.use24
                    ? baseFormat.replace('hh', "HH") : baseFormat;
                // If wrong timezone is provided, the UTC will be used
                zoneName = momentTimezone.tz.names().includes(model.timezone)
                    ? model.timezone : "UTC";
                update();
            }
        }

        // Pull in the model (clockFormat and timezone) from the domain object model
        $scope.$watch('model', updateModel);

        // Listen for clock ticks ... and stop listening on destroy
        unlisten = tickerService.listen(tick);
        $scope.$on('$destroy', unlisten);
    }

    /**
         * Get the clock's time zone, as displayable text.
         * @returns {string}
         */
    ClockController.prototype.zone = function () {
        return this.zoneAbbr;
    };

    /**
         * Get the current time, as displayable text.
         * @returns {string}
         */
    ClockController.prototype.text = function () {
        return this.textValue;
    };

    /**
         * Get the text to display to qualify a time as AM or PM.
         * @returns {string}
         */
    ClockController.prototype.ampm = function () {
        return this.use24 ? '' : this.ampmValue;
    };

    return ClockController;
}
);
