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
         * Controller for the Time of Interest indicator in the conductor itself. Sets the horizontal position of the
         * TOI indicator based on the current value of the TOI, and the width of the TOI conductor.
         * @memberof platform.features.conductor
         */
        function ConductorTOIController($scope, openmct) {
            this.timeAPI = openmct.time;

            //Bind all class functions to 'this'
            Object.keys(ConductorTOIController.prototype).filter(function (key) {
                return typeof ConductorTOIController.prototype[key] === 'function';
            }).forEach(function (key) {
                this[key] = ConductorTOIController.prototype[key].bind(this);
            }.bind(this));

            this.timeAPI.on('timeOfInterest', this.changeTimeOfInterest);
            this.viewService.on('zoom', this.setOffsetFromZoom);
            this.viewService.on('pan', this.setOffsetFromBounds);

            var timeOfInterest = this.timeAPI.timeOfInterest();
            if (timeOfInterest) {
                this.changeTimeOfInterest(timeOfInterest);
            }

            $scope.$on('$destroy', this.destroy);
        }

        /**
         * @private
         */
        ConductorTOIController.prototype.destroy = function () {
            this.timeAPI.off('timeOfInterest', this.changeTimeOfInterest);
            this.viewService.off('zoom', this.setOffsetFromZoom);
            this.viewService.off('pan', this.setOffsetFromBounds);
        };

        /**
         * Given some bounds, set horizontal position of TOI indicator based
         * on current conductor TOI value. Bounds are provided so that
         * ephemeral bounds from zoom and pan events can be used as well
         * as current conductor bounds, allowing TOI to be updated in
         * realtime during scroll and zoom.
         * @param {TimeConductorBounds} bounds
         */
        ConductorTOIController.prototype.setOffsetFromBounds = function (bounds) {
            var toi = this.timeAPI.timeOfInterest();
            if (toi !== undefined) {
                var offset = toi - bounds.start;
                var duration = bounds.end - bounds.start;
                this.left = offset / duration * 100;
                this.pinned = true;
            } else {
                this.left = 0;
                this.pinned = false;
            }
        };

        /**
         * @private
         */
        ConductorTOIController.prototype.setOffsetFromZoom = function (zoom) {
            return this.setOffsetFromBounds(zoom.bounds);
        };

        /**
         * Invoked when time of interest changes. Will set the horizontal offset of the TOI indicator.
         * @private
         */
        ConductorTOIController.prototype.changeTimeOfInterest = function () {
            var bounds = this.timeAPI.bounds();
            if (bounds) {
                this.setOffsetFromBounds(bounds);
            }
        };

        /**
         * On a mouse click event within the TOI element, convert position within element to a time of interest, and
         * set the time of interest on the conductor.
         * @param e The angular $event object
         */
        ConductorTOIController.prototype.setTOIFromPosition = function (e) {
            //TOI is set using the alt key modified + primary click
            if (e.altKey) {
                var element = $(e.currentTarget);
                var width = element.width();
                var relativeX = e.pageX - element.offset().left;
                var percX = relativeX / width;
                var bounds = this.timeAPI.bounds();
                var timeRange = bounds.end - bounds.start;

                this.timeAPI.timeOfInterest(timeRange * percX + bounds.start);
            }
        };

        return ConductorTOIController;
    }
);
