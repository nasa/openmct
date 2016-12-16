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

define(
    [],
    function () {

        /**
         * Controller for the Time of Interest element used in various views to display the TOI. Responsible for setting
         * the text label for the current TOI, and for toggling the (un)pinned state which determines whether the TOI
         * indicator is visible.
         * @constructor
         */
        function TimeOfInterestController($scope, openmct, formatService) {
            this.conductor = openmct.conductor;
            this.formatService = formatService;
            this.format = undefined;
            this.toiText = undefined;
            this.$scope = $scope;

            //Bind all class functions to 'this'
            Object.keys(TimeOfInterestController.prototype).filter(function (key) {
                return typeof TimeOfInterestController.prototype[key] === 'function';
            }).forEach(function (key) {
                this[key] = TimeOfInterestController.prototype[key].bind(this);
            }.bind(this));

            this.conductor.on('timeOfInterest', this.changeTimeOfInterest);
            this.conductor.on('timeSystem', this.changeTimeSystem);
            if (this.conductor.timeSystem()) {
                this.changeTimeSystem(this.conductor.timeSystem());
                var toi = this.conductor.timeOfInterest();
                if (toi) {
                    this.changeTimeOfInterest(toi);
                }
            }

            $scope.$on('$destroy', this.destroy);
        }

        /**
         * Called when the time of interest changes on the conductor. Will pin (display) the TOI indicator, and set the
         * text using the default formatter of the currently active Time System.
         * @private
         * @param {integer} toi Current time of interest in ms
         */
        TimeOfInterestController.prototype.changeTimeOfInterest = function (toi) {
            if (toi !== undefined) {
                this.$scope.pinned = true;
                this.toiText = this.format.format(toi);
            } else {
                this.$scope.pinned = false;
            }
        };

        /**
         * When time system is changed, update the formatter used to
         * display the current TOI label
         */
        TimeOfInterestController.prototype.changeTimeSystem = function (timeSystem) {
            this.format = this.formatService.getFormat(timeSystem.formats()[0]);
        };

        /**
         * @private
         */
        TimeOfInterestController.prototype.destroy = function () {
            this.conductor.off('timeOfInterest', this.changeTimeOfInterest);
            this.conductor.off('timeSystem', this.changeTimeSystem);
        };

        /**
         * Will unpin (hide) the TOI indicator. Has the effect of setting the time of interest to `undefined` on the
         * Time Conductor
         */
        TimeOfInterestController.prototype.dismiss = function () {
            this.conductor.timeOfInterest(undefined);
        };

        /**
         * Sends out a time of interest event with the effect of resetting
         * the TOI displayed in views.
         */
        TimeOfInterestController.prototype.resync = function () {
            this.conductor.timeOfInterest(this.conductor.timeOfInterest());
        };

        return TimeOfInterestController;
    }
);
