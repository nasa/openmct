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
    [
        'EventEmitter'
    ],
    function (EventEmitter) {

        /**
         * A class representing the state of the time conductor view. This
         * exposes details of the UI that are not represented on the
         * TimeConductor API itself such as modes and offsets.
         *
         * @memberof platform.features.conductor
         * @param conductor
         * @param timeSystems
         * @constructor
         */
        function TimeConductorViewService(openmct, timeSystems) {

            EventEmitter.call(this);

            this.timeAPI = openmct.time;
        }

        TimeConductorViewService.prototype = Object.create(EventEmitter.prototype);

        TimeConductorViewService.prototype.calculateBoundsFromOffsets = function (offsets) {
            var oldEnd = this.timeAPI.bounds().end;

            if (offsets && offsets.end !== undefined) {
                //Calculate the previous raw end value (without delta)
                oldEnd = oldEnd - offsets.end;
            }

            var bounds = {
                start: oldEnd - offsets.start,
                end: oldEnd + offsets.end
            };
            return bounds;
        };

        /**
         * An event to indicate that zooming is taking place
         * @event platform.features.conductor.TimeConductorViewService~zoom
         * @property {ZoomLevel} zoom the new zoom level.
         */
        /**
         * Zoom to given time span. Will fire a zoom event with new zoom
         * bounds. Zoom bounds emitted in this way are considered ephemeral
         * and should be overridden by any time conductor bounds events. Does
         * not set bounds globally.
         * @param {number} zoom A time duration in ms
         * @fires platform.features.conductor.TimeConductorViewService~zoom
         * @see module:openmct.TimeConductor#bounds
         */
        TimeConductorViewService.prototype.zoom = function (timeSpan) {
            var zoom = {};

            // If a tick source is defined, then the concept of 'now' is
            // important. Calculate zoom based on 'now'.
            if (this.timeAPI.clock() !== undefined) {
                zoom.offsets = {
                    start: timeSpan,
                    end: this.timeAPI.clockOffsets().end
                };
                zoom.bounds = this.calculateBoundsFromOffsets(zoom.offsets);
            } else {
                var bounds = this.timeAPI.bounds();
                var center = bounds.start + ((bounds.end - bounds.start)) / 2;
                bounds.start = center - timeSpan / 2;
                bounds.end = center + timeSpan / 2;
                zoom.bounds = bounds;
            }

            this.emit("zoom", zoom);
            return zoom;
        };

        return TimeConductorViewService;
    }
);
