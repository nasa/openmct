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

/**
 * This bundle implements views of image telemetry.
 * @namespace platform/features/imagery
 */
define(
    ['moment'],
    function (moment) {
        "use strict";

        var DATE_FORMAT = "YYYY-MM-DD",
            TIME_FORMAT = "HH:mm:ss.SSS";

        /**
         * Controller for the "Imagery" view of a domain object which
         * provides image telemetry.
         * @constructor
         * @memberof platform/features/imagery
         */
        function ImageryController($scope, telemetryHandler) {
            var self = this;

            function releaseSubscription() {
                if (self.handle) {
                    self.handle.unsubscribe();
                    self.handle = undefined;
                }
            }

            function updateValuesCallback() {
                return self.updateValues();
            }

            // Create a new subscription; telemetrySubscriber gets
            // to do the meaningful work here.
            function subscribe(domainObject) {
                releaseSubscription();
                self.date = "";
                self.time = "";
                self.zone = "";
                self.imageUrl = "";
                self.handle = domainObject && telemetryHandler.handle(
                    domainObject,
                    updateValuesCallback,
                    true // Lossless
                );
            }

            // Subscribe to telemetry when a domain object becomes available
            $scope.$watch('domainObject', subscribe);

            // Unsubscribe when the plot is destroyed
            $scope.$on("$destroy", releaseSubscription);
        }

        // Update displayable values to reflect latest image telemetry
        ImageryController.prototype.updateValues = function () {
            var imageObject =
                    this.handle && this.handle.getTelemetryObjects()[0],
                timestamp,
                m;
            if (imageObject && !this.isPaused) {
                timestamp = this.handle.getDomainValue(imageObject);
                m = timestamp !== undefined ?
                        moment.utc(timestamp) :
                        undefined;
                this.date = m ? m.format(DATE_FORMAT) : "";
                this.time = m ? m.format(TIME_FORMAT) : "";
                this.zone = m ? "UTC" : "";
                this.imageUrl = this.handle.getRangeValue(imageObject);
            }
        };

        /**
         * Get the time portion (hours, minutes, seconds) of the
         * timestamp associated with the incoming image telemetry.
         * @returns {string} the time
         */
        ImageryController.prototype.getTime = function () {
            return this.time;
        };

        /**
         * Get the date portion (month, year) of the
         * timestamp associated with the incoming image telemetry.
         * @returns {string} the date
         */
        ImageryController.prototype.getDate = function () {
            return this.date;
        };

        /**
         * Get the time zone for the displayed time/date corresponding
         * to the timestamp associated with the incoming image
         * telemetry.
         * @returns {string} the time
         */
        ImageryController.prototype.getZone = function () {
            return this.zone;
        };

        /**
         * Get the URL of the image telemetry to display.
         * @returns {string} URL for telemetry image
         */
        ImageryController.prototype.getImageUrl = function () {
            return this.imageUrl;
        };

        /**
         * Getter-setter for paused state of the view (true means
         * paused, false means not.)
         * @param {boolean} [state] the state to set
         * @returns {boolean} the current state
         */
        ImageryController.prototype.paused = function (state) {
            if (arguments.length > 0 && state !== this.isPaused) {
                this.isPaused = state;
                // Switch to latest image
                this.updateValues();
            }
            return this.isPaused;
        };

        return ImageryController;
    }
);

