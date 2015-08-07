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
            var date = "",
                time = "",
                imageUrl = "",
                paused = false,
                handle;

            function releaseSubscription() {
                if (handle) {
                    handle.unsubscribe();
                    handle = undefined;
                }
            }

            function updateValues() {
                var imageObject = handle && handle.getTelemetryObjects()[0],
                    m;
                if (imageObject && !paused) {
                    m = moment.utc(handle.getDomainValue(imageObject));
                    date = m.format(DATE_FORMAT);
                    time = m.format(TIME_FORMAT);
                    imageUrl = handle.getRangeValue(imageObject);
                }
            }

            // Create a new subscription; telemetrySubscriber gets
            // to do the meaningful work here.
            function subscribe(domainObject) {
                releaseSubscription();
                date = "";
                time = "";
                imageUrl = "";
                handle = domainObject && telemetryHandler.handle(
                    domainObject,
                    updateValues,
                    true // Lossless
                );
            }

            // Subscribe to telemetry when a domain object becomes available
            $scope.$watch('domainObject', subscribe);

            // Unsubscribe when the plot is destroyed
            $scope.$on("$destroy", releaseSubscription);

            return {
                /**
                 * Get the time portion (hours, minutes, seconds) of the
                 * timestamp associated with the incoming image telemetry.
                 * @returns {string} the time
                 * @memberof platform/features/imagery.ImageryController#
                 */
                getTime: function () {
                    return time;
                },
                /**
                 * Get the date portion (month, year) of the
                 * timestamp associated with the incoming image telemetry.
                 * @returns {string} the date
                 * @memberof platform/features/imagery.ImageryController#
                 */
                getDate: function () {
                    return date;
                },
                /**
                 * Get the time zone for the displayed time/date corresponding
                 * to the timestamp associated with the incoming image
                 * telemetry.
                 * @returns {string} the time
                 * @memberof platform/features/imagery.ImageryController#
                 */
                getZone: function () {
                    return "UTC";
                },
                /**
                 * Get the URL of the image telemetry to display.
                 * @returns {string} URL for telemetry image
                 * @memberof platform/features/imagery.ImageryController#
                 */
                getImageUrl: function () {
                    return imageUrl;
                },
                /**
                 * Getter-setter for paused state of the view (true means
                 * paused, false means not.)
                 * @param {boolean} [state] the state to set
                 * @returns {boolean} the current state
                 * @memberof platform/features/imagery.ImageryController#
                 */
                paused: function (state) {
                    if (arguments.length > 0 && state !== paused) {
                        paused = state;
                        // Switch to latest image
                        updateValues();
                    }
                    return paused;
                }
            };
        }

        return ImageryController;
    }
);

