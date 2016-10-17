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
        function ConductorTOIController($scope, conductor, conductorViewService) {
            this.conductor = conductor;
            this.conductorViewService = conductorViewService;

            //Bind all class functions to 'this'
            Object.keys(ConductorTOIController.prototype).filter(function (key) {
                return typeof ConductorTOIController.prototype[key] === 'function';
            }).forEach(function (key) {
                this[key] = ConductorTOIController.prototype[key].bind(this);
            }.bind(this));

            this.conductor.on('timeOfInterest', this.changeTimeOfInterest);
            this.conductorViewService.on('zoom', this.setOffsetFromBounds);
            this.conductorViewService.on('pan', this.setOffsetFromBounds);
            this.conductor.on('timeSystem', this.changeTimeSystem);

            $scope.$on('$destroy', this.destroy);

        }

        ConductorTOIController.prototype.destroy = function () {
            this.conductor.off('timeOfInterest', this.setOffsetFromBounds);
            this.conductor.off('timeSystem', this.changeTimeSystem);
            this.conductorViewService.off('zoom', this.setOffsetFromBounds);
            this.conductorViewService.off('pan', this.setOffsetFromBounds);
        };

        ConductorTOIController.prototype.setOffsetFromBounds = function (bounds) {
            var toi = this.conductor.timeOfInterest();
            var offset = toi - bounds.start;
            var duration = bounds.end - bounds.start;
            this.left = offset / duration * 100;
        };

        ConductorTOIController.prototype.changeTimeOfInterest = function () {
            var bounds = this.conductor.bounds();
            if (bounds) {
                this.setOffsetFromBounds(bounds);
            }
        };

        ConductorTOIController.prototype.click = function (e) {
            if (e.altKey) {
                var element = $(e.currentTarget);
                var width = element.width();
                var relativeX = e.pageX - element.offset().left;
                var percX = relativeX / width;
                var bounds = this.conductor.bounds();
                var timeRange = bounds.end - bounds.start;

                this.conductor.timeOfInterest(timeRange * percX + bounds.start);
            }
        };

        return ConductorTOIController;
    }
);
