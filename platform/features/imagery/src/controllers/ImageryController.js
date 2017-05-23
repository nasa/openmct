/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

/**
 * This bundle implements views of image telemetry.
 * @namespace platform/features/imagery
 */
define(
    ['moment'],
    function (moment) {

        var DATE_FORMAT = "YYYY-MM-DD",
            TIME_FORMAT = "HH:mm:ss.SSS";

        /**
         * Controller for the "Imagery" view of a domain object which
         * provides image telemetry.
         * @constructor
         * @memberof platform/features/imagery
         */
        function ImageryController($scope, openmct) {
            this.$scope = $scope;
            this.openmct = openmct;
            this.date = "";
            this.time = "";
            this.zone = "";
            this.imageUrl = "";

            this.$scope.filters = {
                brightness: 100,
                contrast: 100
            };

            this.subscribe = this.subscribe.bind(this);
            this.stopListening = this.stopListening.bind(this);
            this.updateValues = this.updateValues.bind(this);

            // Subscribe to telemetry when a domain object becomes available
            this.subscribe(this.$scope.domainObject);

            // Unsubscribe when the plot is destroyed
            this.$scope.$on("$destroy", this.stopListening);
        }

        ImageryController.prototype.subscribe = function (domainObject) {
            this.date = "";
            this.imageUrl = "";
            this.openmct.objects.get(domainObject.getId())
                .then(function (object) {
                    this.domainObject = object;
                    var metadata = this.openmct
                        .telemetry
                        .getMetadata(this.domainObject);
                    var timeKey = this.openmct.time.timeSystem().key;
                    this.timeFormat = this.openmct
                        .telemetry
                        .getValueFormatter(metadata.value(timeKey));
                    this.imageFormat = this.openmct
                        .telemetry
                        .getValueFormatter(metadata.valuesForHints(['image'])[0]);
                    this.unsubscribe = this.openmct.telemetry
                        .subscribe(this.domainObject, this.updateValues);
                }.bind(this));
        };

        ImageryController.prototype.stopListening = function () {
            if (this.unsubscribe) {
                this.unsubscribe();
                delete this.unsubscribe;
            }
        }

        // Update displayable values to reflect latest image telemetry
        ImageryController.prototype.updateValues = function (datum) {
            if (this.isPaused) {
                this.nextValue = datum;
                return;
            }
            this.time = this.timeFormat.format(datum);
            this.image = this.imageFormat.format(datum);
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
         * Get the URL of the image telemetry to display.
         * @returns {string} URL for telemetry image
         */
        ImageryController.prototype.getImageUrl = function () {
            return this.image;
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
                this.updateValues(this.nextValue);
                delete this.nextValue;
            }
            return this.isPaused;
        };

        return ImageryController;
    }
);

