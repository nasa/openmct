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
    ["zepto"],
    function ($) {

        /**
         * The mct-conductor-axis renders a horizontal axis with regular
         * labelled 'ticks'. It requires 'start' and 'end' integer values to
         * be specified as attributes.
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

        TimeOfInterestController.prototype.changeTimeOfInterest = function (toi) {
            if (toi !== undefined) {
                this.$scope.pinned = true;
                this.toiText = this.format.format(toi);
            } else {
                this.$scope.pinned = false;
            }
        };

        TimeOfInterestController.prototype.changeTimeSystem = function (timeSystem) {
            this.format = this.formatService.getFormat(timeSystem.formats()[0]);
        };

        TimeOfInterestController.prototype.destroy = function () {
            this.conductor.off('timeOfInterest', this.changeTimeOfInterest);
            this.conductor.off('timeSystem', this.changeTimeSystem);
        };

        TimeOfInterestController.prototype.dismiss = function () {
            this.conductor.timeOfInterest(undefined);
        };

        TimeOfInterestController.prototype.resync = function () {
            this.conductor.timeOfInterest(this.conductor.timeOfInterest());
        };

        return TimeOfInterestController;
    }
);
